/**
 * Analyzes left-right facial symmetry by comparing paired landmark points
 * mirrored across the facial midline.
 */

import { FacialPoints, Point } from './landmarkMapper';

export interface SymmetryResult {
  /** Overall symmetry percentage (100 = perfect) */
  percentage: number;
  /** Normalized score 0-1 for use in final calculation */
  score: number;
  /** Individual paired point deviations */
  pairDeviations: PairDeviation[];
}

interface PairDeviation {
  name: string;
  deviation: number; // 0 = perfect symmetry
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Mirror a point across a vertical axis at the given x coordinate.
 */
function mirrorPoint(point: Point, axisX: number): Point {
  return {
    x: 2 * axisX - point.x,
    y: point.y,
  };
}

/**
 * Calculate how closely a mirrored left point matches the actual right point.
 * Returns deviation as a fraction of face width (0 = perfect).
 */
function pairSymmetry(left: Point, right: Point, midX: number, faceWidth: number): number {
  const mirrored = mirrorPoint(left, midX);
  const diff = dist(mirrored, right);
  return faceWidth > 0 ? diff / faceWidth : 0;
}

/**
 * Analyze symmetry of the face by comparing paired landmarks.
 */
export function analyzeSymmetry(points: FacialPoints): SymmetryResult {
  const midX = (points.leftCheek.x + points.rightCheek.x) / 2;
  const faceWidth = Math.abs(points.rightCheek.x - points.leftCheek.x);

  // Guard: if cheeks are too close, use the Euclidean distance as fallback
  const effectiveWidth = faceWidth > 10 ? faceWidth : dist(points.leftCheek, points.rightCheek);

  if (effectiveWidth <= 0) {
    return { percentage: 75, score: 0.75, pairDeviations: [] };
  }

  const pairs: { name: string; left: Point; right: Point }[] = [
    { name: 'Eyes', left: points.leftEyeCenter, right: points.rightEyeCenter },
    { name: 'Eye Inner', left: points.leftEyeInner, right: points.rightEyeInner },
    { name: 'Eye Outer', left: points.leftEyeOuter, right: points.rightEyeOuter },
    { name: 'Brow Inner', left: points.leftBrowInner, right: points.rightBrowInner },
    { name: 'Brow Outer', left: points.leftBrowOuter, right: points.rightBrowOuter },
    { name: 'Nose Alar', left: points.leftNoseAlar, right: points.rightNoseAlar },
    { name: 'Mouth Corner', left: points.mouthLeft, right: points.mouthRight },
    { name: 'Jaw', left: points.leftJaw, right: points.rightJaw },
  ];

  const pairDeviations: PairDeviation[] = pairs.map(({ name, left, right }) => ({
    name,
    // Cap individual deviations to prevent one outlier from tanking the score
    deviation: Math.min(0.3, pairSymmetry(left, right, midX, effectiveWidth)),
  }));

  // Contour symmetry is noisier — include it at reduced weight
  const contourDeviation = calculateContourSymmetry(points.leftContour, points.rightContour, midX, effectiveWidth);
  pairDeviations.push({ name: 'Contour', deviation: Math.min(0.2, contourDeviation) });

  // Weighted average: landmark pairs count 2x, contour counts 1x
  const landmarkSum = pairDeviations.slice(0, -1).reduce((sum, p) => sum + p.deviation, 0);
  const landmarkCount = pairDeviations.length - 1;
  const avgDeviation = landmarkCount > 0
    ? (landmarkSum * 2 + contourDeviation) / (landmarkCount * 2 + 1)
    : contourDeviation;

  // Convert to percentage — use multiplier of 2.5 so typical faces land 70-95%
  // 0.02 (2%) deviation → 95%  |  0.06 (6%) → 85%  |  0.12 (12%) → 70%
  const percentage = Math.max(0, Math.min(100, (1 - avgDeviation * 2.5) * 100));

  // Score for weighted calculation (0-1)
  const score = percentage / 100;

  if (__DEV__) {
    console.log('[MogCheck] Symmetry:', {
      midX: midX.toFixed(1),
      faceWidth: effectiveWidth.toFixed(1),
      avgDeviation: avgDeviation.toFixed(4),
      percentage: percentage.toFixed(1),
      pairs: pairDeviations.map(p => `${p.name}: ${(p.deviation * 100).toFixed(1)}%`),
    });
  }

  return { percentage, score, pairDeviations };
}

/**
 * Compare left and right face contour point distributions.
 */
function calculateContourSymmetry(
  leftContour: Point[],
  rightContour: Point[],
  midX: number,
  faceWidth: number,
): number {
  if (leftContour.length === 0 || rightContour.length === 0) return 0;

  // Sort both sides by y-coordinate for comparison
  const sortedLeft = [...leftContour].sort((a, b) => a.y - b.y);
  const sortedRight = [...rightContour].sort((a, b) => a.y - b.y);

  const count = Math.min(sortedLeft.length, sortedRight.length);
  let totalDeviation = 0;

  for (let i = 0; i < count; i++) {
    const leftIdx = Math.floor((i / count) * sortedLeft.length);
    const rightIdx = Math.floor((i / count) * sortedRight.length);
    totalDeviation += pairSymmetry(sortedLeft[leftIdx], sortedRight[rightIdx], midX, faceWidth);
  }

  return count > 0 ? totalDeviation / count : 0;
}
