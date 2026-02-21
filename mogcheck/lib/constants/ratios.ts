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
    weight: 0.15,
    category: 'primary',
  },
  {
    id: 'facial_thirds',
    name: 'Facial Thirds',
    description: 'Upper:Middle:Lower face proportion balance',
    ideal: 1.0, // Ratio of deviation from equal thirds
    weight: 0.15,
    category: 'primary',
  },
  {
    id: 'eye_spacing',
    name: 'Eye Spacing',
    description: 'Inter-pupillary distance ÷ face width',
    ideal: 0.45,
    idealRange: [0.44, 0.46],
    weight: 0.10,
    category: 'primary',
  },
  {
    id: 'nose_mouth_width',
    name: 'Nose:Mouth Width',
    description: 'Alar width ÷ mouth width',
    ideal: INV_PHI,
    weight: 0.08,
    category: 'primary',
  },
  {
    id: 'jaw_face_width',
    name: 'Jaw:Face Width',
    description: 'Gonial width ÷ bizygomatic width',
    ideal: 0.775,
    idealRange: [0.75, 0.80],
    weight: 0.10,
    category: 'primary',
  },
  {
    id: 'lower_mid_face',
    name: 'Lower:Midface',
    description: 'Nose base-to-chin ÷ brow-to-nose base',
    ideal: 1.0,
    idealRange: [0.95, 1.05],
    weight: 0.08,
    category: 'primary',
  },

  // Secondary ratios
  {
    id: 'eye_width_face',
    name: 'Eye Width:Face',
    description: 'Palpebral fissure ÷ face width',
    ideal: 0.245,
    idealRange: [0.23, 0.26],
    weight: 0.05,
    category: 'secondary',
  },
  {
    id: 'lip_ratio',
    name: 'Lip Ratio',
    description: 'Upper lip height ÷ lower lip height',
    ideal: INV_PHI,
    weight: 0.05,
    category: 'secondary',
  },
  {
    id: 'nose_face_length',
    name: 'Nose:Face Length',
    description: 'Nasion-to-subnasale ÷ trichion-to-menton',
    ideal: 0.315,
    idealRange: [0.30, 0.33],
    weight: 0.05,
    category: 'secondary',
  },
  {
    id: 'chin_lower_face',
    name: 'Chin:Lower Face',
    description: 'Labiale inferius-to-menton ÷ subnasale-to-menton',
    ideal: 0.475,
    idealRange: [0.45, 0.50],
    weight: 0.04,
    category: 'secondary',
  },
];

// Symmetry is handled separately — 15% of total
export const SYMMETRY_WEIGHT = 0.15;

// Verify weights sum to 1.0
const ratioWeightSum = RATIO_DEFINITIONS.reduce((sum, r) => sum + r.weight, 0);
const totalWeight = ratioWeightSum + SYMMETRY_WEIGHT;
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`Ratio weights sum to ${totalWeight}, expected 1.0`);
}
