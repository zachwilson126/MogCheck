// Supabase Edge Function: generate-transform
// Proxies Stability AI API for "Glow Up" image transformation.
// Flow: Verify auth → Check coins → Deduct 5 coins → Call Stability AI → Return image

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const COIN_COST = 5;

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

    // 3. Parse request (expects multipart form with image + analysis JSON)
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const analysisJson = formData.get('analysis') as string;

    if (!image || !analysisJson) {
      return new Response(JSON.stringify({ error: 'Missing image or analysis data' }), { status: 400 });
    }

    const analysis = JSON.parse(analysisJson);

    // Build targeted enhancement prompt based on weak ratios
    const weakFeatures: string[] = [];
    if (analysis.weakestRatios) {
      for (const ratio of analysis.weakestRatios) {
        if (ratio.name.toLowerCase().includes('jaw')) weakFeatures.push('strong defined jawline');
        if (ratio.name.toLowerCase().includes('eye')) weakFeatures.push('balanced eye proportions');
        if (ratio.name.toLowerCase().includes('nose')) weakFeatures.push('harmonious nose proportions');
        if (ratio.name.toLowerCase().includes('lip')) weakFeatures.push('balanced lip proportions');
        if (ratio.name.toLowerCase().includes('face')) weakFeatures.push('ideal facial proportions');
      }
    }

    const enhancePrompt = `Professional headshot photo of the same person with enhanced facial proportions. ${weakFeatures.join(', ')}. Maintain the person's identity, skin tone, hair color, and ethnicity. Photorealistic, high quality, natural lighting, front-facing.`;

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

    // 5. Call Stability AI img2img
    const stabilityForm = new FormData();
    stabilityForm.append('init_image', image);
    stabilityForm.append('text_prompts[0][text]', enhancePrompt);
    stabilityForm.append('text_prompts[0][weight]', '1');
    stabilityForm.append('text_prompts[1][text]', 'ugly, deformed, disfigured, different person, different identity');
    stabilityForm.append('text_prompts[1][weight]', '-1');
    stabilityForm.append('cfg_scale', '7');
    stabilityForm.append('image_strength', '0.35'); // 0.3-0.5 range to preserve identity
    stabilityForm.append('steps', '30');
    stabilityForm.append('samples', '1');

    const stabilityResponse = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: 'application/json',
        },
        body: stabilityForm,
      },
    );

    if (!stabilityResponse.ok) {
      // Refund coins on API failure
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id);

      const errBody = await stabilityResponse.text();
      console.error('Stability AI error:', errBody);
      return new Response(
        JSON.stringify({ error: 'Transformation failed. Coins refunded.' }),
        { status: 502 },
      );
    }

    const stabilityData = await stabilityResponse.json();
    const transformedImage = stabilityData.artifacts?.[0]?.base64;

    if (!transformedImage) {
      // Refund
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id);
      return new Response(
        JSON.stringify({ error: 'No image generated. Coins refunded.' }),
        { status: 502 },
      );
    }

    // NOTE: We do NOT store the image server-side. Privacy first.
    return new Response(
      JSON.stringify({
        transformed_image: transformedImage,
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
