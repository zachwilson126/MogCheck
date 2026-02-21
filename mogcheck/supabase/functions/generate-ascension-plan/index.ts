// Supabase Edge Function: generate-ascension-plan
// Generates personalized improvement tips via Claude API.
// Flow: Verify auth → Check coins → Deduct 2 coins → Call Claude → Return plan

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ASCENSION_SYSTEM_PROMPT = `Generate a personalized "Ascension Plan" for someone with these facial analysis results.
The tone is looksmaxxing culture but the advice should be ACTUALLY HELPFUL and SAFE.

Format the response as JSON with these categories:
{
  "mewing_jaw": "2-3 sentences about jaw/tongue posture exercises",
  "skin": "2-3 sentences about skincare routine",
  "hair": "2-3 sentences about hairstyle suggestions based on their face shape",
  "fitness": "2-3 sentences about posture, neck training, body composition",
  "style": "2-3 sentences about grooming suggestions"
}

CRITICAL RULES:
- NEVER suggest surgery, injections, fillers, or any medical procedure
- NEVER suggest bonesmashing, face pulling, or any dangerous practice
- NEVER suggest specific supplements, peptides, or pharmaceuticals
- Focus on: skincare, grooming, hairstyle, posture, fitness, style
- Be funny but genuinely useful
- Frame everything as "optimization" not "fixing"
- Use looksmaxxing slang naturally but keep advice safe
- Reference their specific weak ratios in the advice`;

const COIN_COST = 2;

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

    // 3. Parse analysis data
    const analysisData = await req.json();

    // 4. Deduct coins
    await supabase
      .from('profiles')
      .update({ coins: profile.coins - COIN_COST })
      .eq('id', user.id);

    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -COIN_COST,
      type: 'ascension',
    });

    // 5. Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        system: ASCENSION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate an Ascension Plan for this analysis:\n${JSON.stringify(analysisData, null, 2)}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      // Refund coins on failure
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ error: 'Plan generation failed. Coins refunded.' }),
        { status: 502 },
      );
    }

    const claudeData = await claudeResponse.json();
    const planText = claudeData.content?.[0]?.text ?? '{}';

    // Try to parse as JSON, fallback to raw text
    let plan: Record<string, string>;
    try {
      plan = JSON.parse(planText);
    } catch {
      plan = { general: planText };
    }

    return new Response(
      JSON.stringify({ plan }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Ascension plan error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 },
    );
  }
});
