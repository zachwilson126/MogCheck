/**
 * Calculates facial ratios from mapped landmark points.
 * Each ratio measures a specific facial proportion and compares it to an ideal value.
 */

import { FacialPoints, Point } from './landmarkMapper';
import { RATIO_DEFINITIONS, RatioDefinition } from '../constants/ratios';

export interface RatioResult {
  id: string;
  name: string;
  description: string;
  measured: number;
  ideal: number;
  deviation: number; // 0 = perfect, 1 = 100% off
  score: number; // 0-1 normalized
  weight: number;
  category: 'primary' | 'secondary';
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Get robust face width using cheeks as primary, with jaw and eye fallbacks.
 * Never returns 0 — always provides a usable measurement.
 */
function getFaceWidth(points: FacialPoints): number {
  // Primary: cheek-to-cheek (bizygomatic width)
  const cheekWidth = dist(points.leftCheek, points.rightCheek);
  if (cheekWidth > 5) return cheekWidth;

  // Fallback 1: jaw width (gonion-to-gonion, slightly narrower than cheeks)
  const jawWidth = dist(points.leftJaw, points.rightJaw);
  if (jawWidth > 5) return jawWidth;

  // Fallback 2: outer eye corner distance (narrower than face, but usable)
  const eyeWidth = dist(points.leftEyeOuter, points.rightEyeOuter);
  if (eyeWidth > 5) return eyeWidth;

  // Last resort: x-distance between cheeks (avoids dist returning 0 if points overlap)
  return Math.max(Math.abs(points.rightCheek.x - points.leftCheek.x), 1);
}

/**
 * Get robust face length using hairline-to-chin as primary, with fallbacks.
 * Never returns 0 — always provides a usable measurement.
 */
function getFaceLength(points: FacialPoints): number {
  // Primary: hairline to chin (full face length)
  const fullLength = dist(points.hairline, points.chin);
  if (fullLength > 5) return fullLength;

  // Fallback 1: browCenter-to-chin covers ~2/3 of face length
  const browToChin = dist(points.browCenter, points.chin);
  if (browToChin > 5) return browToChin * 1.5;

  // Fallback 2: nasion-to-chin covers ~2/3 of face length
  const nasionToChin = dist(points.nasion, points.chin);
  if (nasionToChin > 5) return nasionToChin * 1.5;

  // Last resort: y-distance between hairline and chin
  return Math.max(Math.abs(points.chin.y - points.hairline.y), 1);
}

/**
 * Calculate the measured value for each defined ratio.
 */
function measureRatio(def: RatioDefinition, points: FacialPoints): number {
  switch (def.id) {
    case 'face_length_width': {
      const faceLength = getFaceLength(points);
      const faceWidth = getFaceWidth(points);
      return faceWidth > 0 ? faceLength / faceWidth : 0;
    }

    case 'eye_spacing': {
      const ipd = dist(points.leftEyeCenter, points.rightEyeCenter);
      const faceWidth = getFaceWidth(points);
      return faceWidth > 0 ? ipd / faceWidth : 0;
    }

    case 'nose_mouth_width': {
      const noseWidth = dist(points.leftNoseAlar, points.rightNoseAlar);
      const mouthWidth = dist(points.mouthLeft, points.mouthRight);
      return mouthWidth > 0 ? noseWidth / mouthWidth : 0;
    }

    case 'jaw_face_width': {
      const jawWidth = dist(points.leftJaw, points.rightJaw);
      const faceWidth = getFaceWidth(points);
      return faceWidth > 0 ? jawWidth / faceWidth : 0;
    }

    case 'nose_face_length': {
      let noseLength = dist(points.nasion, points.noseBase);
      // If nasion and noseBase overlap (both fell back to eye midpoint),
      // estimate nose length from browCenter to noseBase instead
      if (noseLength < 3) {
        noseLength = dist(points.browCenter, points.noseBase);
      }
      const faceLength = getFaceLength(points);
      return faceLength > 0 ? noseLength / faceLength : 0;
    }

    default:
      return 0;
  }
}

/**
 * Calculate deviation from ideal for a single ratio.
 * Returns a value from 0 (perfect) to 1+ (very far off).
 */
function calculateDeviation(measured: number, def: RatioDefinition): number {
  if (def.idealRange) {
    const [low, high] = def.idealRange;
    if (measured >= low && measured <= high) {
      return 0; // Within acceptable range
    }
    // Distance from nearest edge of range
    const nearest = measured < low ? low : high;
    return Math.abs(measured - nearest) / nearest;
  }

  if (def.ideal === 0) return measured;
  return Math.abs(measured - def.ideal) / def.ideal;
}

/**
 * Convert a deviation to a 0-1 score using the spec's calibration:
 * - 0-5% deviation → 0.9-1.0 (score 9-10)
 * - 5-15% deviation → 0.7-0.9 (score 7-8)
 * - 15-25% deviation → 0.5-0.7 (score 5-6)
 * - 25-40% deviation → 0.3-0.5 (score 3-4)
 * - 50%+ deviation → 0-0.2 (score 0-2)
 *
 * Using a penalty multiplier of 2.0 with a floor of 0.
 * The previous 3.0 was too harsh — any 33%+ deviation scored 0,
 * leaving no room for MLKit landmark imprecision.
 */
function deviationToScore(deviation: number): number {
  const penaltyMultiplier = 2.0;
  return Math.max(0, 1 - deviation * penaltyMultiplier);
}

/**
 * Calculate all facial ratios from landmark points.
 * If a measurement returns 0 (bad data), assign a neutral score (0.5)
 * instead of 0, so one bad measurement doesn't tank the entire score.
 */
export function calculateRatios(points: FacialPoints): RatioResult[] {
  return RATIO_DEFINITIONS.map((def) => {
    const measured = measureRatio(def, points);

    // Guard: if measurement is 0/negative or outside physiologically possible range,
    // data is bad — assign neutral score instead of punishing with 0
    const outOfValidRange = def.validRange
      && (measured < def.validRange[0] || measured > def.validRange[1]);
    if (measured <= 0 || outOfValidRange) {
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        measured,
        ideal: def.ideal,
        deviation: 0,
        score: 0.5, // Neutral — don't penalize or reward bad data
        weight: def.weight,
        category: def.category,
      };
    }

    const deviation = calculateDeviation(measured, def);
    const score = deviationToScore(deviation);

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      measured,
      ideal: def.ideal,
      deviation,
      score,
      weight: def.weight,
      category: def.category,
    };
  });
}
