/**
 * Analyzes the three facial thirds:
 * - Upper: Hairline to brow
 * - Middle: Brow to nose base
 * - Lower: Nose base to chin
 *
 * Ideal proportion is 1:1:1 (equal thirds).
 */

import { FacialPoints, Point } from './landmarkMapper';

export interface FacialThirdsResult {
  upper: number; // percentage
  middle: number;
  lower: number;
  balance: number; // 0-1, how close to equal thirds
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function analyzeFacialThirds(points: FacialPoints): FacialThirdsResult {
  const upper = dist(points.hairline, points.browCenter);
  const middle = dist(points.browCenter, points.noseBase);
  const lower = dist(points.noseBase, points.chin);
  const total = upper + middle + lower;

  if (total === 0) {
    return { upper: 33, middle: 33, lower: 34, balance: 0 };
  }

  const upperPct = Math.round((upper / total) * 100);
  const middlePct = Math.round((middle / total) * 100);
  const lowerPct = 100 - upperPct - middlePct;

  // Balance: how close to equal thirds
  const idealThird = total / 3;
  const maxDeviation = Math.max(
    Math.abs(upper - idealThird),
    Math.abs(middle - idealThird),
    Math.abs(lower - idealThird),
  );
  const balance = Math.max(0, 1 - (maxDeviation / idealThird));

  return { upper: upperPct, middle: middlePct, lower: lowerPct, balance };
}
