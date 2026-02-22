/**
 * Ad management for MogCheck.
 *
 * Uses Google AdMob via react-native-google-mobile-ads.
 * - Interstitial: shown between scan completion and results screen
 * - Banner: shown at bottom of main screens
 *
 * Replace test ad unit IDs with production IDs before App Store release.
 * Get your ad unit IDs from https://admob.google.com
 */

import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// =====================================================
// AD UNIT IDS
// Replace with your real AdMob unit IDs before release.
// Test IDs are used by default for safe development.
// =====================================================
const AD_UNITS = {
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? TestIds.INTERSTITIAL),
  banner: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? TestIds.ADAPTIVE_BANNER),
};

export { AD_UNITS };

// Pre-loaded interstitial instance
let interstitial: InterstitialAd | null = null;
let isInterstitialLoaded = false;

/**
 * Pre-load an interstitial ad so it's ready when the scan completes.
 * Call this when the scan screen mounts.
 */
export function preloadInterstitial(): void {
  try {
    interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial);

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      // Pre-load the next one
      preloadInterstitial();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      isInterstitialLoaded = false;
    });

    interstitial.load();
  } catch {
    // Ad SDK may not be initialized yet — fail silently
  }
}

/**
 * Show the interstitial ad if one is loaded.
 * Returns a promise that resolves when the ad is closed (or immediately if no ad).
 */
export function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    if (!interstitial || !isInterstitialLoaded) {
      resolve();
      return;
    }

    const closeListener = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      closeListener();
      resolve();
    });

    try {
      interstitial.show();
    } catch {
      closeListener();
      resolve();
    }
  });
}
