// Supabase Edge Function: generate-battle-verdict
// Proxies Claude API to generate funny battle commentary.
// Flow: Verify auth → Check coins → Deduct 1 coin → Call Claude → Return verdict

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const VERDICT_SYSTEM_PROMPT = `You are MogCheck's Mog Battle judge. You receive two players' facial analysis scores and generate a short, hilarious battle verdict commentary. Your tone is:

- Like a UFC commentator who also watches too much TikTok
- Uses Gen Z / internet slang (mog, mogged, gigamogged, ratio'd, no cap, fr fr, ong, it's giving, bruh, lowkey)
- References looksmaxxing culture naturally
- Short: 3-5 sentences max
- Reference the SPECIFIC score difference and what categories decided it
- If it's close, make it dramatic ("THIS IS BASICALLY A TIE")
- If it's a blowout, be theatrical ("ABSOLUTE DEMOLITION")
- Keep it fun and non-personal — roast the numbers, not the people
- End with a challenge or call to action ("Rematch? The ratios demand it.")

IMPORTANT: This is entertainment. Never reference race, ethnicity, gender identity, disability, or anything discriminatory. Pure facial geometry commentary only.

Score difference determines intensity:
- 0-0.5: "This was INSANELY close. Practically identical genetic coding."
- 0.5-1.5: "A solid win but the loser isn't out yet. One mewing arc could flip this."
- 1.5-3.0: "Clear mog. The golden ratio has spoken."
- 3.0+: "GIGAMOGGED. This wasn't even competitive. One of them is built different."`;

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

    // 3. Parse battle data
    const battleData = await req.json();

    // 4. Deduct coin
    await supabase
      .from('profiles')
      .update({ coins: profile.coins - COIN_COST })
      .eq('id', user.id);

    // Log transaction
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -COIN_COST,
      type: 'battle_verdict',
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
        system: VERDICT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a battle verdict for this Mog Battle:\n${JSON.stringify(battleData, null, 2)}`,
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
        JSON.stringify({ error: 'Verdict generation failed. Coin refunded.' }),
        { status: 502 },
      );
    }

    const claudeData = await claudeResponse.json();
    const verdictText = claudeData.content?.[0]?.text ?? 'The AI refuses to pick a side. Both of you are too powerful.';

    return new Response(
      JSON.stringify({ verdict_text: verdictText }),
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
