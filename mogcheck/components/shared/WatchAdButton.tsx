import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../lib/constants/theme';
import { GlowButton } from './GlowButton';
import { useUserStore } from '../../lib/store/useUserStore';
import { preloadRewarded, showRewarded, isRewardedReady } from '../../lib/ads/adManager';

/**
 * "Watch Ad for a Free Coin" button.
 * Shows a rewarded video ad and grants 1 coin on completion.
 */
export function WatchAdButton() {
  const addCoins = useUserStore((s) => s.addCoins);
  const [loading, setLoading] = useState(false);
  const [justEarned, setJustEarned] = useState(false);

  useEffect(() => {
    preloadRewarded();
  }, []);

  const handleWatchAd = async () => {
    setLoading(true);
    setJustEarned(false);

    const earned = await showRewarded();

    if (earned) {
      addCoins(1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJustEarned(true);
      // Reset the "earned" state after a moment
      setTimeout(() => setJustEarned(false), 3000);
    }

    setLoading(false);
  };

  if (justEarned) {
    return (
      <View style={styles.earnedCard}>
        <Text style={styles.earnedText}>+1 coin earned! 🪙</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.freeLabel}>
        <Text style={styles.freeLabelText}>FREE</Text>
      </View>
      <Text style={styles.title}>Watch an ad, get a coin 🎬</Text>
      <Text style={styles.subtitle}>30 second video = 1 free coin</Text>
      <GlowButton
        title={loading ? 'Loading...' : 'Watch Ad for 1 Coin'}
        onPress={handleWatchAd}
        variant="outline"
        size="medium"
        color="#FFD700"
        disabled={loading}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 8,
    alignItems: 'center',
  },
  freeLabel: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  freeLabelText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: '#FFD700',
    letterSpacing: 2,
  },
  title: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  earnedCard: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  earnedText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
});
