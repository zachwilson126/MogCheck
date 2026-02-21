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
 * Calculate the measured value for each defined ratio.
 */
function measureRatio(def: RatioDefinition, points: FacialPoints): number {
  switch (def.id) {
    case 'face_length_width': {
      const faceLength = dist(points.hairline, points.chin);
      const faceWidth = dist(points.leftCheek, points.rightCheek);
      return faceWidth > 0 ? faceLength / faceWidth : 0;
    }

    case 'facial_thirds': {
      const upper = dist(points.hairline, points.browCenter);
      const middle = dist(points.browCenter, points.noseBase);
      const lower = dist(points.noseBase, points.chin);
      const total = upper + middle + lower;
      if (total === 0) return 0;
      // Measure how close to equal thirds (1:1:1)
      // Perfect = each third is exactly 1/3 of total
      const idealThird = total / 3;
      const maxDev = Math.max(
        Math.abs(upper - idealThird),
        Math.abs(middle - idealThird),
        Math.abs(lower - idealThird),
      );
      // Return 1 - normalized deviation (1.0 = perfect equal thirds)
      return 1.0 - (maxDev / idealThird);
    }

    case 'eye_spacing': {
      const ipd = dist(points.leftEyeCenter, points.rightEyeCenter);
      const faceWidth = dist(points.leftCheek, points.rightCheek);
      return faceWidth > 0 ? ipd / faceWidth : 0;
    }

    case 'nose_mouth_width': {
      const noseWidth = dist(points.leftNoseAlar, points.rightNoseAlar);
      const mouthWidth = dist(points.mouthLeft, points.mouthRight);
      return mouthWidth > 0 ? noseWidth / mouthWidth : 0;
    }

    case 'jaw_face_width': {
      const jawWidth = dist(points.leftJaw, points.rightJaw);
      const faceWidth = dist(points.leftCheek, points.rightCheek);
      return faceWidth > 0 ? jawWidth / faceWidth : 0;
    }

    case 'lower_mid_face': {
      const lowerFace = dist(points.noseBase, points.chin);
      const midFace = dist(points.browCenter, points.noseBase);
      return midFace > 0 ? lowerFace / midFace : 0;
    }

    case 'eye_width_face': {
      const leftEyeWidth = dist(points.leftEyeInner, points.leftEyeOuter);
      const rightEyeWidth = dist(points.rightEyeInner, points.rightEyeOuter);
      const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
      const faceWidth = dist(points.leftCheek, points.rightCheek);
      return faceWidth > 0 ? avgEyeWidth / faceWidth : 0;
    }

    case 'lip_ratio': {
      const upperLipHeight = dist(points.upperLipTop, points.upperLipBottom);
      const lowerLipHeight = dist(points.lowerLipTop, points.lowerLipBottom);
      return lowerLipHeight > 0 ? upperLipHeight / lowerLipHeight : 0;
    }

    case 'nose_face_length': {
      const noseLength = dist(points.nasion, points.noseBase);
      const faceLength = dist(points.hairline, points.chin);
      return faceLength > 0 ? noseLength / faceLength : 0;
    }

    case 'chin_lower_face': {
      // Approximate labiale inferius as midpoint of lower lip bottom and chin
      const labialeInferius = {
        x: (points.lowerLipBottom.x + points.chin.x) / 2,
        y: (points.lowerLipBottom.y + points.chin.y) / 2,
      };
      const chinToLabiale = dist(labialeInferius, points.chin);
      const lowerFace = dist(points.noseBase, points.chin);
      return lowerFace > 0 ? chinToLabiale / lowerFace : 0;
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
 * - 40%+ deviation → 0.1-0.3 (score 1-2)
 *
 * Using a penalty multiplier of ~3.0 achieves this curve.
 */
function deviationToScore(deviation: number): number {
  const penaltyMultiplier = 3.0;
  return Math.max(0, 1 - deviation * penaltyMultiplier);
}

/**
 * Calculate all facial ratios from landmark points.
 */
export function calculateRatios(points: FacialPoints): RatioResult[] {
  return RATIO_DEFINITIONS.map((def) => {
    const measured = measureRatio(def, points);
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
