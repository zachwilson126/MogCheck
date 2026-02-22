/**
 * Banner ad component for bottom of screens.
 */

import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../../lib/ads/adManager';

interface AdBannerProps {
  size?: 'banner' | 'large' | 'adaptive';
}

export function AdBanner({ size = 'adaptive' }: AdBannerProps) {
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
