/**
 * Banner ad component for bottom of screens.
 * Wrapped in error boundary + deferred render to prevent native ad crashes
 * from killing the app (especially on iPad).
 */

import React, { Component, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS, isAdsInitialized } from '../../lib/ads/adManager';

interface AdBannerProps {
  size?: 'banner' | 'large' | 'adaptive';
}

/**
 * Error boundary that catches native ad crashes and renders nothing.
 */
class AdErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silently swallow ad errors — ads are non-critical
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function AdBannerInner({ size = 'adaptive' }: AdBannerProps) {
  const [ready, setReady] = useState(false);

  // Defer ad rendering to avoid crashing during initial TurboModule setup
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !isAdsInitialized()) {
    return null;
  }

  const adSize = size === 'large'
    ? BannerAdSize.LARGE_BANNER
    : size === 'banner'
      ? BannerAdSize.BANNER
      : BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={adSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {
          // Silently handle ad load failures
        }}
      />
    </View>
  );
}

export function AdBanner(props: AdBannerProps) {
  return (
    <AdErrorBoundary>
      <AdBannerInner {...props} />
    </AdErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
