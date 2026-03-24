/**
 * Ads are intentionally disabled in this stabilization branch.
 *
 * The App Store startup crashes consistently pointed to native ad/TurboModule
 * initialization during launch, so these helpers are kept as no-ops until the
 * release build is stable again.
 */

export const AD_UNITS = {
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '',
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '',
  rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? '',
};

export async function initializeAds(): Promise<void> {}

export function isAdsInitialized(): boolean {
  return false;
}

export function preloadInterstitial(): void {}

export async function showInterstitial(): Promise<void> {}

export function preloadRewarded(): void {}

export function isRewardedReady(): boolean {
  return false;
}

export async function showRewarded(): Promise<boolean> {
  return false;
}
