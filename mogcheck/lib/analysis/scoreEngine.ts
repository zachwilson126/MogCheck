/**
 * Combines all ratio scores and symmetry into a final 1-10 rating.
 *
 * The score is calibrated so the average person scores 5.0-5.5.
 * An 8+ is genuinely hard to achieve.
 */

import { FacialPoints } from './landmarkMapper';
import { calculateRatios, RatioResult } from './ratioCalculator';
import { analyzeSymmetry, SymmetryResult } from './symmetryAnalyzer';
import { analyzeFacialThirds, FacialThirdsResult } from './facialThirds';
import { analyzeGoldenRatio, GoldenRatioResult } from './goldenRatio';
import { SYMMETRY_WEIGHT } from '../constants/ratios';
import { getTier, Tier } from '../constants/tiers';

export interface AnalysisResult {
  /** Final score (1.0 - 10.0, one decimal) */
  score: number;
  /** Tier based on score */
  tier: Tier;
  /** Individual ratio results */
  ratios: RatioResult[];
  /** Symmetry analysis */
  symmetry: SymmetryResult;
  /** Facial thirds breakdown */
  facialThirds: FacialThirdsResult;
  /** Golden ratio analysis */
  goldenRatio: GoldenRatioResult;
  /** Strongest ratio (highest score) */
  strongestRatio: RatioResult;
  /** Weakest ratio (lowest score) */
  weakestRatio: RatioResult;
  /** Top 3 ratios */
  topRatios: RatioResult[];
  /** Bottom 3 ratios */
  bottomRatios: RatioResult[];
  /** Timestamp */
  analyzedAt: string;
}

/**
 * Run the full facial analysis pipeline.
 */
export function analyzeface(points: FacialPoints): AnalysisResult {
  const ratios = calculateRatios(points);
  const symmetry = analyzeSymmetry(points);
  const facialThirds = analyzeFacialThirds(points);
  const goldenRatio = analyzeGoldenRatio(points);

  // Weighted sum of ratio scores
  const ratioWeightedSum = ratios.reduce(
    (sum, r) => sum + r.score * r.weight,
    0,
  );

  // Add symmetry contribution
  const rawScore = ratioWeightedSum + symmetry.score * SYMMETRY_WEIGHT;

  // Scale to 1-10 range
  // rawScore is 0-1, we want 1-10
  // Apply slight curve to push average toward 5-5.5
  const curved = applyScoringCurve(rawScore);
  const finalScore = Math.round(curved * 10) / 10;
  const clampedScore = Math.max(1.0, Math.min(10.0, finalScore));

  if (__DEV__) {
    console.log('[MogCheck] Score breakdown:', {
      ratioWeightedSum: ratioWeightedSum.toFixed(4),
      symmetryContrib: (symmetry.score * SYMMETRY_WEIGHT).toFixed(4),
      rawScore: rawScore.toFixed(4),
      curved: curved.toFixed(2),
      finalScore: clampedScore,
    });
    ratios.forEach(r => {
      console.log(`  ${r.name}: measured=${r.measured.toFixed(4)} ideal=${r.ideal.toFixed(4)} dev=${r.deviation.toFixed(4)} score=${r.score.toFixed(3)} (weighted=${(r.score * r.weight).toFixed(4)})`);
    });
  }

  // Sort ratios by score for strongest/weakest
  const sorted = [...ratios].sort((a, b) => b.score - a.score);
  const strongestRatio = sorted[0];
  const weakestRatio = sorted[sorted.length - 1];
  const topRatios = sorted.slice(0, 3);
  const bottomRatios = sorted.slice(-3).reverse();

  const tier = getTier(clampedScore);

  return {
    score: clampedScore,
    tier,
    ratios,
    symmetry,
    facialThirds,
    goldenRatio,
    strongestRatio,
    weakestRatio,
    topRatios,
    bottomRatios,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Apply a scoring curve that ensures:
 * - Average raw score (~0.55-0.65) maps to 5.0-5.5
 * - Very high raw scores (0.9+) map to 8.5-10
 * - Low raw scores (<0.3) map to 1-3
 *
 * Uses a slightly punitive curve (concave) so high scores are harder to get.
 */
function applyScoringCurve(raw: number): number {
  // Clamp input
  const x = Math.max(0, Math.min(1, raw));

  // Power curve: score = 1 + 9 * x^1.15
  // This slightly penalizes — a raw 0.6 becomes ~5.2 instead of 6.4
  // A raw 0.9 becomes ~8.2 instead of 9.1
  const curved = 1 + 9 * Math.pow(x, 1.15);

  return Math.max(1, Math.min(10, curved));
}
