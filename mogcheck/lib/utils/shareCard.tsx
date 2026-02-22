import { View, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRef } from 'react';
import { AnalysisResult } from '../analysis';
import { colors } from '../constants/theme';

interface ShareCardData {
  score: number;
  tierName: string;
  tierColor: string;
  symmetryPercentage: number;
  strongestRatio: string;
}

/**
 * Generates and shares a score card image.
 * The card shows score + tier only — no photo for privacy.
 */
export async function shareResults(viewShotRef: React.RefObject<ViewShot | null>): Promise<void> {
  if (!viewShotRef.current) return;

  try {
    const uri = await viewShotRef.current.capture?.();
    if (!uri) return;

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your MogCheck results',
      });
    }
  } catch (error) {
    if (__DEV__) console.error('Share failed:', error);
  }
}

/**
 * The visual share card component.
 * Wrap this in a ViewShot to capture as image.
 */
export function ShareCardContent({ analysis }: { analysis: AnalysisResult }) {
  const tierColor = analysis.tier.color;

  return (
    <View style={styles.card}>
      {/* Noise/texture overlay effect */}
      <View style={styles.noiseOverlay} />

      <Text style={styles.logo}>MOGCHECK</Text>

      <Text style={[styles.score, { color: tierColor }]}>
        {analysis.score.toFixed(1)}
      </Text>

      <View style={[styles.tierBadge, { borderColor: tierColor }]}>
        <Text style={[styles.tierText, { color: tierColor }]}>{analysis.tier.name}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Symmetry</Text>
          <Text style={[styles.statValue, { color: tierColor }]}>
            {Math.round(analysis.symmetry.percentage)}%
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Best Ratio</Text>
          <Text style={[styles.statValue, { color: tierColor }]}>
            {analysis.strongestRatio.name}
          </Text>
        </View>
      </View>

      <Text style={styles.tagline}>Think you can beat this? Scan your face.</Text>
      <Text style={styles.disclaimer}>For entertainment purposes only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 350,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.05,
    backgroundColor: '#333',
  },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: '#39FF14',
    letterSpacing: 4,
    marginBottom: 24,
  },
  score: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 80,
    letterSpacing: 2,
  },
  tierBadge: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  tierText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#666',
  },
  statValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2A2A',
  },
  tagline: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 8,
  },
  disclaimer: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 9,
    color: '#666',
  },
});
