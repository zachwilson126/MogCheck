export interface Tier {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  vibe: string;
}

export const TIERS: Tier[] = [
  { name: 'CHUD', minScore: 1.0, maxScore: 2.4, color: '#DC2626', vibe: 'Brutal. Needs divine intervention.' },
  { name: 'NPC', minScore: 2.5, maxScore: 3.9, color: '#9CA3AF', vibe: 'Background character energy. Forgettable.' },
  { name: 'MID', minScore: 4.0, maxScore: 5.4, color: '#EAB308', vibe: 'Aggressively average. Could go either way.' },
  { name: 'CHADLITE', minScore: 5.5, maxScore: 6.9, color: '#60A5FA', vibe: 'Potential detected. Almost there.' },
  { name: 'CHAD', minScore: 7.0, maxScore: 8.4, color: '#F59E0B', vibe: 'Strong genetics. The blueprint.' },
  { name: 'GIGACHAD', minScore: 8.5, maxScore: 10.0, color: '#A855F7', vibe: 'Mathematically elite. Walking golden ratio.' },
];

export function getTier(score: number): Tier {
  const clamped = Math.max(1.0, Math.min(10.0, score));
  for (const tier of TIERS) {
    if (clamped >= tier.minScore && clamped <= tier.maxScore) {
      return tier;
    }
  }
  return TIERS[2]; // MID fallback
}
