/**
 * Golden ratio (φ = 1.618) comparison utilities.
 * Used to evaluate how closely facial proportions match φ.
 */

import { FacialPoints, Point } from './landmarkMapper';
import { PHI } from '../constants/ratios';

export interface GoldenRatioResult {
  /** Overall phi compliance score (0-1) */
  phiScore: number;
  /** Individual phi comparisons */
  comparisons: PhiComparison[];
}

interface PhiComparison {
  name: string;
  ratio: number;
  deviationFromPhi: number;
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calculate how closely key facial dimensions align with φ.
 * This is supplementary to the main ratio analysis — provides
 * a "golden ratio percentage" for display purposes.
 */
export function analyzeGoldenRatio(points: FacialPoints): GoldenRatioResult {
  const comparisons: PhiComparison[] = [];

  // Face length:width vs φ
  const faceLength = dist(points.hairline, points.chin);
  const faceWidth = dist(points.leftCheek, points.rightCheek);
  if (faceWidth > 0) {
    const ratio = faceLength / faceWidth;
    comparisons.push({
      name: 'Face Proportion',
      ratio,
      deviationFromPhi: Math.abs(ratio - PHI) / PHI,
    });
  }

  // Mouth width to nose width vs φ
  const mouthWidth = dist(points.mouthLeft, points.mouthRight);
  const noseWidth = dist(points.leftNoseAlar, points.rightNoseAlar);
  if (noseWidth > 0) {
    const ratio = mouthWidth / noseWidth;
    comparisons.push({
      name: 'Mouth:Nose Width',
      ratio,
      deviationFromPhi: Math.abs(ratio - PHI) / PHI,
    });
  }

  // Eye spacing to eye width vs φ
  const eyeSpacing = dist(points.leftEyeCenter, points.rightEyeCenter);
  const leftEyeWidth = dist(points.leftEyeInner, points.leftEyeOuter);
  if (leftEyeWidth > 0) {
    const ratio = eyeSpacing / leftEyeWidth;
    comparisons.push({
      name: 'Eye Spacing:Width',
      ratio,
      deviationFromPhi: Math.abs(ratio - PHI) / PHI,
    });
  }

  // Nose-to-chin vs lips-to-chin
  const noseToChin = dist(points.noseBase, points.chin);
  const lipsToChin = dist(points.lowerLipBottom, points.chin);
  if (lipsToChin > 0) {
    const ratio = noseToChin / lipsToChin;
    comparisons.push({
      name: 'Nose-Chin:Lips-Chin',
      ratio,
      deviationFromPhi: Math.abs(ratio - PHI) / PHI,
    });
  }

  // Overall phi score (average of all comparisons)
  const avgDeviation = comparisons.length > 0
    ? comparisons.reduce((sum, c) => sum + c.deviationFromPhi, 0) / comparisons.length
    : 1;

  const phiScore = Math.max(0, 1 - avgDeviation * 2.5);

  return { phiScore, comparisons };
}
