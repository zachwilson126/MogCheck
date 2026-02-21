/**
 * Placeholder roast texts by tier (used before Claude API integration).
 * In Phase 2, these get replaced by live Claude API calls.
 */

const CHUD_ROASTS = [
  "Brother, the golden ratio didn't just skip you — it filed a restraining order. That jaw-to-face ratio is giving 'evolutionary afterthought.' But hey, mewing is free and so is hope. Start yesterday. 💀",
  "Your facial thirds said 'we don't know her' to each other. The symmetry score has me thinking one side of your face is running on a different patch version. On the bright side, personality is technically a feature. Fr fr. 🫠",
  "The ratios came back and I'm lowkey speechless. Your nose-to-mouth width ratio is giving Habsburg family reunion vibes. But ong, a solid skincare routine and a fresh cut could bump you up. The grind starts now. 📈",
];

const NPC_ROASTS = [
  "You're giving main character energy... of a background NPC in a cutscene nobody watches. Your eye spacing is decent but that jaw ratio is running on borrowed time. One good mewing arc and you could ascend fr. 🎮",
  "The math says 'forgettable' but not 'hopeless.' Your facial thirds are slightly off — the lower third is carrying the team and struggling. Good news: a beard could literally change your whole vibe. No cap. 🧔",
  "You know when a game has randomly generated NPCs? That's the energy. Symmetry is mid, ratios are mid, it's a mid fest. But a solid glow-up montage is literally RIGHT THERE. Start with the jaw exercises. 💪",
];

const MID_ROASTS = [
  "Perfectly balanced, as all mid things should be. Your eye spacing is actually goated but that lip ratio is not pulling its weight. You're one tier away from Chadlite and the gap is closable. The grind doesn't stop. ⚖️",
  "Aggressively average. Your golden ratio compliance is giving 'close but no cigar.' The symmetry is decent though — like a 78, which is passing grade energy. A fresh lineup and proper skincare would change the game. 📊",
  "The numbers don't lie and they say... exactly what you'd expect. Mid. Your strongest feature is your eye width ratio (respect) but the facial thirds are having an identity crisis. You've got potential though, no cap. 🔢",
];

const CHADLITE_ROASTS = [
  "You're literally ONE tier away. The ratios are solid — that face length-to-width is flirting with golden ratio territory. Your weakest link is the jaw width but even that's above average. The grind is paying off. 📈",
  "Chadlite status confirmed. Your symmetry score is actually impressive — most people's faces look like they were assembled from two different IKEA sets. Keep the skincare up and that Chad promotion is incoming. 🏆",
  "Not gonna lie, the numbers are respecting you. Eye spacing ratio is chef's kiss, facial thirds are nearly balanced. You're the tutorial boss before the actual Chad boss fight. Almost there, king. 👑",
];

const CHAD_ROASTS = [
  "Okay we see you. The golden ratio chose violence with this one. Your facial proportions are giving Renaissance painting and your symmetry score is making me question my own face. Strong genetic lottery pull, no cap. 🎨",
  "The ratios came back and they're just... respectful. Face length-to-width is near perfect φ, the thirds are balanced, and that jaw ratio is structural engineering. You didn't choose the Chad life, it chose you. 🏛️",
  "I'm not rating you, I'm studying you at this point. That eye spacing is textbook ideal and your lip ratio is golden. The only thing keeping you from Gigachad is a 0.3% symmetry deviation. Literally elite. 📐",
];

const GIGACHAD_ROASTS = [
  "I'm not even rating you, I'm studying you. The golden ratio didn't just choose you — it moved in and started paying rent. Every single ratio is in the elite range. This is what peak mathematical beauty looks like. Scientists should be taking notes. 🧬",
  "Brother, you're not walking around, you're conducting a field study on everyone else's insecurities. Your facial thirds are so perfectly balanced they could be used to calibrate measuring instruments. Genuinely unprecedented. We're witnessing history. 📐",
  "The algorithm broke. It keeps running the numbers and getting the same result: elite. Your symmetry score is higher than most people's total score. At this point, you're not playing the game — you ARE the meta. GG. 🏆",
];

export const PLACEHOLDER_ROASTS: Record<string, string[]> = {
  CHUD: CHUD_ROASTS,
  NPC: NPC_ROASTS,
  MID: MID_ROASTS,
  CHADLITE: CHADLITE_ROASTS,
  CHAD: CHAD_ROASTS,
  GIGACHAD: GIGACHAD_ROASTS,
};

/**
 * Get a random placeholder roast for a tier.
 */
export function getPlaceholderRoast(tierName: string): string {
  const roasts = PLACEHOLDER_ROASTS[tierName] ?? MID_ROASTS;
  return roasts[Math.floor(Math.random() * roasts.length)];
}
