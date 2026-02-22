/**
 * Facial ratio definitions with ideal values and weights.
 * Golden ratio (φ) = 1.618033988749895
 * Inverse golden ratio (1/φ) = 0.618033988749895
 */

export const PHI = 1.618033988749895;
export const INV_PHI = 1 / PHI;

export interface RatioDefinition {
  id: string;
  name: string;
  description: string;
  /** Ideal value or midpoint of ideal range */
  ideal: number;
  /** If set, defines an acceptable range [idealLow, idealHigh] instead of a single point */
  idealRange?: [number, number];
  /** Weight as a fraction (all weights should sum to 1.0) */
  weight: number;
  /** Category for grouping in UI */
  category: 'primary' | 'secondary';
}

export const RATIO_DEFINITIONS: RatioDefinition[] = [
  // Primary ratios (heavily weighted)
  {
    id: 'face_length_width',
    name: 'Face Length:Width',
    description: 'Hairline-to-chin ÷ bizygomatic width',
    ideal: PHI,
    weight: 0.20,
    category: 'primary',
  },
  {
    id: 'eye_spacing',
    name: 'Eye Spacing',
    description: 'Inter-pupillary distance ÷ face width',
    ideal: 0.45,
    idealRange: [0.42, 0.48],
    weight: 0.18,
    category: 'primary',
  },
  {
    id: 'nose_mouth_width',
    name: 'Nose:Mouth Width',
    description: 'Alar width ÷ mouth width',
    ideal: INV_PHI,
    weight: 0.16,
    category: 'primary',
  },
  {
    id: 'jaw_face_width',
    name: 'Jaw:Face Width',
    description: 'Gonial width ÷ bizygomatic width',
    ideal: 0.775,
    idealRange: [0.72, 0.83],
    weight: 0.18,
    category: 'primary',
  },

  // Secondary ratios
  {
    id: 'nose_face_length',
    name: 'Nose:Face Length',
    description: 'Nasion-to-subnasale ÷ trichion-to-menton',
    ideal: 0.315,
    idealRange: [0.28, 0.35],
    weight: 0.13,
    category: 'secondary',
  },
];

// Symmetry is handled separately — 15% of total
export const SYMMETRY_WEIGHT = 0.15;

// Verify weights sum to 1.0
const ratioWeightSum = RATIO_DEFINITIONS.reduce((sum, r) => sum + r.weight, 0);
const totalWeight = ratioWeightSum + SYMMETRY_WEIGHT;
if (__DEV__ && Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`Ratio weights sum to ${totalWeight}, expected 1.0`);
}
