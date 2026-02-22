// Supabase Edge Function: generate-ascension-plan
// Generates personalized improvement tips via Claude API.
// Flow: Verify auth → Check coins → Deduct 2 coins → Call Claude → Return plan

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// 5 prompt directions per category — one is randomly selected each time
// so every ascension plan feels unique
const MEWING_JAW_PROMPTS = [
  'Focus on tongue posture fundamentals: proper mewing technique, suction hold, and why consistency matters more than force. Mention the posterior third.',
  'Focus on jaw muscle conditioning: chewing exercises with mastic or falim gum, sets/reps, alternating sides. Mention masseter hypertrophy.',
  'Focus on sleep posture for jaw symmetry: back sleeping, cervical pillows, mouth taping for nasal breathing. Mention facial compression.',
  'Focus on myofunctional habits: swallowing patterns, lip seal, chin tucks for submental tightening. Mention the tongue-palate connection.',
  'Focus on TMJ-safe jaw optimization: gentle clench-and-release exercises, neck-jaw relationship, avoiding hard mewing myths.',
];

const SKIN_PROMPTS = [
  'Focus on a beginner-friendly routine: cleanser, moisturizer, SPF 50. Emphasize the holy trinity and hydration.',
  'Focus on chemical exfoliation: AHAs vs BHAs, frequency, moisture barrier protection. Mention niacinamide and retinol timing.',
  'Focus on acne and pore control: double cleansing, salicylic acid, pillowcase hygiene, and gut-skin connection.',
  'Focus on anti-aging prevention: tretinoin introduction, vitamin C serum under SPF, and collagen preservation.',
  'Focus on skin texture and glow: hydration layering, hyaluronic acid, cold water rinses, and cutting dairy for 30 days.',
];

const HAIR_PROMPTS = [
  'Focus on face shape optimization: which hairstyles balance their specific proportions, volume placement, and part direction.',
  'Focus on hair health fundamentals: scalp care, salicylic acid shampoo, rice water rinses, and avoiding heat damage.',
  'Focus on styling technique: blow-dry method, pre-stylers vs post-stylers, and how to get effortless-looking hair.',
  'Focus on hairline and density: derma rolling for blood flow, minoxidil if thinning, and how to work with cowlicks.',
  'Focus on forehead ratio balancing: curtain bangs vs swept back, textured fringe, and how hair rebalances facial thirds.',
];

const FITNESS_PROMPTS = [
  'Focus on posture transformation: forward head posture fixes, face pulls, chin tucks against a wall, and how posture changes profile.',
  'Focus on neck training: neck curls, extensions, plate-on-forehead technique, and how a thick neck reframes the jaw.',
  'Focus on body fat and facial definition: why sub-15% is the jawline threshold, intermittent fasting, and cardio importance.',
  'Focus on V-taper framing: lateral raises, shoulder press, and how wide shoulders make the face look more proportional.',
  'Focus on the lean face pipeline: why body composition > bodyweight, trap development, and how leanness reveals bone structure.',
];

const STYLE_PROMPTS = [
  'Focus on the grooming multiplier: shaped brows, clean nails, fitted clothes, and high-impact low-effort moves.',
  'Focus on color theory: finding their season (warm/cool/neutral), shopping by undertone, and why $30 in your color beats $300.',
  'Focus on strategic accessories: watches, chains, how the right glasses rebalance face ratios, and UV protection.',
  'Focus on fragrance as invisible accessory: daytime vs evening scents, pulse point application, and signature scent strategy.',
  'Focus on fit optimization: slim-fit vs oversized, monochrome for height, tailoring game-changers, and minimalist wardrobe.',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSystemPrompt(): string {
  return `Generate a personalized "Ascension Plan" for someone with these facial analysis results.
The tone is looksmaxxing culture but the advice should be ACTUALLY HELPFUL and SAFE.

Format the response as JSON with these categories:
{
  "mewing_jaw": "2-3 sentences. ${pickRandom(MEWING_JAW_PROMPTS)}",
  "skin": "2-3 sentences. ${pickRandom(SKIN_PROMPTS)}",
  "hair": "2-3 sentences. ${pickRandom(HAIR_PROMPTS)}",
  "fitness": "2-3 sentences. ${pickRandom(FITNESS_PROMPTS)}",
  "style": "2-3 sentences. ${pickRandom(STYLE_PROMPTS)}"
}

CRITICAL RULES:
- NEVER suggest surgery, injections, fillers, or any medical procedure
- NEVER suggest bonesmashing, face pulling, or any dangerous practice
- NEVER suggest specific supplements, peptides, or pharmaceuticals
- Focus on: skincare, grooming, hairstyle, posture, fitness, style
- Be funny but genuinely useful
- Frame everything as "optimization" not "fixing"
- Use looksmaxxing slang naturally but keep advice safe
- Reference their specific weak ratios in the advice
- Each category MUST have unique, specific advice — never repeat the same tip across categories`;
}

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
        system: buildSystemPrompt(),
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
