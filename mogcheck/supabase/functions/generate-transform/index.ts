// Supabase Edge Function: generate-transform
// Proxies Replicate API (SDXL img2img) for "Glow Up" image transformation.
// Flow: Verify auth → Check coins → Deduct 5 coins → Call Replicate → Poll → Return image

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const COIN_COST = 5;
const SDXL_VERSION = '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // 1. Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 });
    }

    // 2. Check coin balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single();

    if (!profile || profile.coins < COIN_COST) {
      return new Response(JSON.stringify({ error: 'Not enough coins' }), { status: 402 });
    }

    // 3. Parse request (multipart form: image + analysis JSON)
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const analysisJson = formData.get('analysis') as string;

    if (!image || !analysisJson) {
      return new Response(JSON.stringify({ error: 'Missing image or analysis data' }), { status: 400 });
    }

    const analysis = JSON.parse(analysisJson);

    // Convert image to base64 data URI using Deno std lib (handles large binaries)
    const imageBytes = new Uint8Array(await image.arrayBuffer());
    const b64 = base64Encode(imageBytes);
    const imageDataUri = `data:image/jpeg;base64,${b64}`;

    // Build targeted enhancement prompt
    const weakFeatures: string[] = [];
    if (analysis.weakestRatios) {
      for (const ratio of analysis.weakestRatios) {
        const name = ratio.name.toLowerCase();
        if (name.includes('jaw')) weakFeatures.push('strong defined jawline');
        if (name.includes('eye')) weakFeatures.push('balanced eye proportions');
        if (name.includes('nose')) weakFeatures.push('harmonious nose proportions');
        if (name.includes('lip')) weakFeatures.push('balanced lip proportions');
        if (name.includes('face')) weakFeatures.push('ideal facial proportions');
      }
    }

    const enhancePrompt = `Professional headshot photo of the same person with subtly enhanced facial proportions. ${weakFeatures.join(', ')}. Maintain the person's identity, skin tone, hair color, and ethnicity exactly. Photorealistic, high quality, natural lighting, front-facing portrait.`;
    const negativePrompt = 'ugly, deformed, disfigured, different person, different identity, cartoon, anime, painting, drawing, blurry';

    // 4. Deduct coins
    await supabase
      .from('profiles')
      .update({ coins: profile.coins - COIN_COST })
      .eq('id', user.id);

    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -COIN_COST,
      type: 'transform',
    });

    // 5. Call Replicate SDXL img2img
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: SDXL_VERSION,
        input: {
          image: imageDataUri,
          prompt: enhancePrompt,
          negative_prompt: negativePrompt,
          prompt_strength: 0.35,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_outputs: 1,
          disable_safety_checker: true,
          apply_watermark: false,
        },
      }),
    });

    if (!createResponse.ok) {
      const errBody = await createResponse.text();
      console.error('Replicate create error:', createResponse.status, errBody);
      // Refund coins
      await refundCoins(supabase, user.id, profile.coins);
      return new Response(
        JSON.stringify({ error: 'Transformation failed. Coins refunded.' }),
        { status: 502 },
      );
    }

    let result = await createResponse.json();

    // 6. Poll for completion if sync mode didn't finish
    if (result.status !== 'succeeded' && result.urls?.get) {
      for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const pollResponse = await fetch(result.urls.get, {
          headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
        });
        result = await pollResponse.json();
      }
    }

    if (result.status === 'failed' || result.status === 'canceled') {
      console.error('Replicate failed:', result.error);
      await refundCoins(supabase, user.id, profile.coins);
      return new Response(
        JSON.stringify({ error: 'Transformation failed. Coins refunded.' }),
        { status: 502 },
      );
    }

    // 7. Get output image URL
    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    if (!outputUrl) {
      console.error('No output URL in result');
      await refundCoins(supabase, user.id, profile.coins);
      return new Response(
        JSON.stringify({ error: 'No image generated. Coins refunded.' }),
        { status: 502 },
      );
    }

    // 8. Fetch generated image and convert to base64
    const imageResponse = await fetch(outputUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch output image:', imageResponse.status);
      await refundCoins(supabase, user.id, profile.coins);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve generated image. Coins refunded.' }),
        { status: 502 },
      );
    }

    const outputBytes = new Uint8Array(await imageResponse.arrayBuffer());
    const outputBase64 = base64Encode(outputBytes);

    return new Response(
      JSON.stringify({
        transformed_image: outputBase64,
        disclaimer: 'AI-generated image. For entertainment only. Does not represent achievable results.',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Transform error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 },
    );
  }
});

async function refundCoins(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  originalCoins: number,
) {
  await supabase
    .from('profiles')
    .update({ coins: originalCoins })
    .eq('id', userId);
}
