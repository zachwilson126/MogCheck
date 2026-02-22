import { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { colors } from '../../lib/constants/theme';
import { useUserStore } from '../../lib/store/useUserStore';
import { ScoreReveal } from '../../components/results/ScoreReveal';
import { RatioBreakdown } from '../../components/results/RatioBreakdown';
import { RoastCard } from '../../components/results/RoastCard';
import { DisclaimerBanner } from '../../components/shared/DisclaimerBanner';
import { GlowButton } from '../../components/shared/GlowButton';
import { CoinBalance } from '../../components/store/CoinBalance';
import { ShareCardContent, shareResults } from '../../lib/utils/shareCard';
import { AscensionPlan } from '../../components/results/AscensionPlan';
import { AdBanner } from '../../components/shared/AdBanner';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const router = useRouter();
  const scanHistory = useUserStore((s) => s.scanHistory);

  const scan = scanHistory.find((s) => s.id === id);

  if (!scan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Scan not found</Text>
          <GlowButton title="Go Home" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const { analysis } = scan;
  const tierColor = analysis.tier.color;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace('/')}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>RESULTS 🧬</Text>
        <CoinBalance size="small" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Reveal */}
        <ScoreReveal
          score={analysis.score}
          tierName={analysis.tier.name}
          tierColor={tierColor}
        />

        {/* Vibe text */}
        <Text style={[styles.vibeText, { color: tierColor }]}>
          {analysis.tier.vibe}
        </Text>

        {/* Symmetry */}
        <View style={[styles.symmetryCard, { borderWidth: 1, borderColor: tierColor }]}>
          <Text style={styles.symmetryLabel}>SYMMETRY ⚖️</Text>
          <Text style={[styles.symmetryValue, { color: tierColor }]}>
            {Math.round(analysis.symmetry.percentage)}%
          </Text>
        </View>

        {/* Strongest / Weakest */}
        <View style={styles.featuresRow}>
          <View style={[styles.featureCard, { borderColor: colors.primary }]}>
            <Text style={styles.featureLabel}>STRONGEST 💪</Text>
            <Text style={styles.featureName}>{analysis.strongestRatio.name}</Text>
            <Text style={[styles.featureScore, { color: colors.primary }]}>
              {(analysis.strongestRatio.score * 10).toFixed(1)}
            </Text>
          </View>
          <View style={[styles.featureCard, { borderColor: colors.error }]}>
            <Text style={styles.featureLabel}>WEAKEST 💀</Text>
            <Text style={styles.featureName}>{analysis.weakestRatio.name}</Text>
            <Text style={[styles.featureScore, { color: colors.error }]}>
              {(analysis.weakestRatio.score * 10).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Ratio Breakdown (Radar + Bars) */}
        <RatioBreakdown ratios={analysis.ratios} tierColor={tierColor} />

        {/* Roast Card */}
        <View style={{ marginTop: 24 }}>
          <RoastCard tierName={analysis.tier.name} tierColor={tierColor} analysis={analysis} />
        </View>

        {/* Ascension Plan */}
        <View style={{ marginTop: 24 }}>
          <AscensionPlan analysis={analysis} tierColor={tierColor} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GlowButton
            title="Mog Battle ⚔️"
            onPress={() => router.push(`/battle/${scan.id}`)}
            variant="outline"
            size="medium"
            color={colors.chad}
          />
          <GlowButton
            title="Share Results 📤"
            onPress={() => shareResults(viewShotRef)}
            variant="secondary"
            size="medium"
          />
        </View>

        <DisclaimerBanner text="Scores are based on mathematical ratios and do not represent actual attractiveness or human value. For entertainment purposes only." />

        {/* Banner Ad */}
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          <AdBanner />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Hidden share card for capture */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <ShareCardContent analysis={analysis} />
        </ViewShot>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 12,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  vibeText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  symmetryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  symmetryLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  symmetryValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  featureLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  featureName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  featureScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
});
