// Supabase Edge Function: generate-roast
// Proxies Claude API to generate personalized roast text.
// Flow: Verify auth → Check coins → Deduct 1 coin → Call Claude → Return roast

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ROAST_SYSTEM_PROMPT = `You are MogCheck's roast engine. You receive facial analysis data and generate a short, funny, sarcastic rating commentary. Your tone is:

- Brutally honest but ultimately good-natured (like a friend who roasts you)
- Uses Gen Z / internet slang naturally (mog, mogged, chud, gigachad, NPC, mid, ratio, no cap, lowkey, it's giving, fr fr, ong, bruh)
- References looksmaxxing culture (mewing, bonesmashing, canthal tilt, hunter eyes, jaw gains)
- Short: 3-5 sentences max
- Should reference their SPECIFIC weak/strong ratios (e.g., "That jaw-to-face ratio is giving Habsburg dynasty")
- Never cruel about things people can't change. Roast the numbers, not the person.
- Include one genuinely helpful (but still funny) improvement suggestion
- End with something encouraging wrapped in humor

IMPORTANT: This is entertainment. Never reference race, ethnicity, gender identity, disability, or anything that could be discriminatory. Keep it about facial geometry and proportions only.

Score tiers determine roast intensity:
- CHUD (1-2.4): Maximum brain rot energy. "Brother needs to start mewing YESTERDAY."
- NPC (2.5-3.9): Sympathetic but honest. "You're one jawline exercise away from having a jawline."
- MID (4.0-5.4): The sweet spot for humor. "Perfectly balanced, as all mid things should be."
- CHADLITE (5.5-6.9): Encouraging with edge. "You're literally one tier away. The grind doesn't stop."
- CHAD (7.0-8.4): Respectful with slight jealousy. "Okay we see you. The golden ratio chose violence today."
- GIGACHAD (8.5-10): Pure reverence. "I'm not even rating you, I'm studying you."`;

const COIN_COST = 1;

Deno.serve(async (req) => {
  // CORS
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

    // 4. Deduct coin
    await supabase
      .from('profiles')
      .update({ coins: profile.coins - COIN_COST })
      .eq('id', user.id);

    // Log transaction
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -COIN_COST,
      type: 'roast',
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
        max_tokens: 300,
        system: ROAST_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a roast for this facial analysis:\n${JSON.stringify(analysisData, null, 2)}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      // Refund coin on API failure
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ error: 'Roast generation failed. Coin refunded.' }),
        { status: 502 },
      );
    }

    const claudeData = await claudeResponse.json();
    const roastText = claudeData.content?.[0]?.text ?? 'The AI is speechless. That says something.';

    return new Response(
      JSON.stringify({ roast_text: roastText }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 },
    );
  }
});
