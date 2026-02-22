export interface Tier {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  vibe: string;
}

export const TIERS: Tier[] = [
  { name: 'CHUD', minScore: 1.0, maxScore: 2.4, color: '#DC2626', vibe: 'its giving goblin mode. unironically tragic.' },
  { name: 'NPC', minScore: 2.5, maxScore: 3.9, color: '#9CA3AF', vibe: 'background character energy fr. nobody remembers u.' },
  { name: 'MID', minScore: 4.0, maxScore: 5.4, color: '#EAB308', vibe: 'aggressively mid. the algorithm is confused by u.' },
  { name: 'CHADLITE', minScore: 5.5, maxScore: 6.9, color: '#60A5FA', vibe: 'almost mogging. ur one mewing sesh away.' },
  { name: 'CHAD', minScore: 7.0, maxScore: 8.4, color: '#F59E0B', vibe: 'elite bone structure detected. the lobby fears u.' },
  { name: 'GIGACHAD', minScore: 8.5, maxScore: 10.0, color: '#A855F7', vibe: 'mathematically unmoggable. actual main character.' },
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
