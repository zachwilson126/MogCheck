/**
 * Ad management for MogCheck.
 *
 * Uses Google AdMob via react-native-google-mobile-ads.
 * - Interstitial: shown between scan completion and results screen
 * - Banner: shown at bottom of main screens
 * - Rewarded: watch ad to earn 1 free coin
 *
 * Replace test ad unit IDs with production IDs before App Store release.
 * Get your ad unit IDs from https://admob.google.com
 */

import {
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
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
  rewarded: __DEV__
    ? TestIds.REWARDED
    : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? TestIds.REWARDED),
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

// =====================================================
// REWARDED ADS — Watch ad to earn 1 free coin
// =====================================================

let rewarded: RewardedAd | null = null;
let isRewardedLoaded = false;

/**
 * Pre-load a rewarded ad so it's ready when the user taps "Watch Ad".
 */
export function preloadRewarded(): void {
  try {
    rewarded = RewardedAd.createForAdRequest(AD_UNITS.rewarded);

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
    });

    rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      isRewardedLoaded = false;
      // Pre-load the next one
      preloadRewarded();
    });

    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      isRewardedLoaded = false;
    });

    rewarded.load();
  } catch {
    // Ad SDK may not be initialized yet — fail silently
  }
}

/**
 * Check if a rewarded ad is ready to show.
 */
export function isRewardedReady(): boolean {
  return isRewardedLoaded;
}

/**
 * Show a rewarded ad. Returns true if the user earned the reward,
 * false if the ad wasn't available or was dismissed before completion.
 */
export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewarded || !isRewardedLoaded) {
      resolve(false);
      return;
    }

    let earned = false;

    const rewardListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );

    const closeListener = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardListener();
      closeListener();
      resolve(earned);
    });

    try {
      rewarded.show();
    } catch {
      rewardListener();
      closeListener();
      resolve(false);
    }
  });
}
