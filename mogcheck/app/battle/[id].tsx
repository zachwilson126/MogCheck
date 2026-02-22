import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tierColors } from '../../lib/constants/theme';
import { useUserStore, ScanHistoryEntry } from '../../lib/store/useUserStore';
import { GlowButton } from '../../components/shared/GlowButton';
import { CoinBalance } from '../../components/store/CoinBalance';
import { BattleResult } from '../../components/battle/BattleResult';
import { BattleComparison } from '../../components/battle/BattleComparison';
import { VerdictCard } from '../../components/battle/VerdictCard';
import { DisclaimerBanner } from '../../components/shared/DisclaimerBanner';

/**
 * Battle results screen.
 *
 * For local (non-server) battles: both scans come from local history.
 * The route param `id` is the challenger's scan ID.
 * The route param `opponentId` is the opponent's scan ID.
 *
 * For server-synced battles, we'd load from Supabase.
 * Phase 3 MVP uses local-first approach.
 */
export default function BattleScreen() {
  const { id, opponentId } = useLocalSearchParams<{ id: string; opponentId?: string }>();
  const router = useRouter();
  const scanHistory = useUserStore((s) => s.scanHistory);

  const challengerScan = scanHistory.find((s) => s.id === id);
  const opponentScan = opponentId ? scanHistory.find((s) => s.id === opponentId) : null;

  if (!challengerScan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Battle not found</Text>
          <GlowButton title="Go Home" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  // Waiting for opponent
  if (!opponentScan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>MOG BATTLE ⚔️</Text>
          <CoinBalance size="small" />
        </View>

        <View style={styles.centered}>
          <MaterialCommunityIcons name="sword-cross" size={64} color={colors.chad} />
          <Text style={styles.waitingTitle}>BATTLE READY 🥊</Text>
          <Text style={styles.waitingText}>
            Your score: {challengerScan.score.toFixed(1)} ({challengerScan.tierName})
          </Text>
          <Text style={styles.waitingSubtext}>
            Share the battle link to challenge someone, or pick an opponent from your scan history.
          </Text>

          <GlowButton
            title="Share Battle Link"
            onPress={() => handleShareBattle(challengerScan)}
            size="medium"
            color={colors.chad}
            style={{ marginTop: 24 }}
          />

          {/* Pick from own history */}
          {scanHistory.length > 1 && (
            <View style={styles.pickSection}>
              <Text style={styles.pickTitle}>Or pick from your scans:</Text>
              {scanHistory
                .filter((s) => s.id !== id)
                .slice(0, 5)
                .map((scan) => (
                  <Pressable
                    key={scan.id}
                    style={styles.pickCard}
                    onPress={() => router.replace(`/battle/${id}?opponentId=${scan.id}`)}
                  >
                    <Text style={[styles.pickScore, { color: tierColors[scan.tierName] ?? colors.text }]}>
                      {scan.score.toFixed(1)}
                    </Text>
                    <Text style={styles.pickTier}>{scan.tierName}</Text>
                    <Text style={styles.pickDate}>
                      {new Date(scan.analyzedAt).toLocaleDateString()}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                  </Pressable>
                ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Battle is on — show results
  const challengerAnalysis = challengerScan.analysis;
  const opponentAnalysis = opponentScan.analysis;

  const challengerWon = challengerAnalysis.score >= opponentAnalysis.score;
  const winnerAnalysis = challengerWon ? challengerAnalysis : opponentAnalysis;
  const loserAnalysis = challengerWon ? opponentAnalysis : challengerAnalysis;
  const winnerName = challengerWon ? 'You' : 'Opponent';
  const loserName = challengerWon ? 'Opponent' : 'You';
  const scoreDiff = Math.abs(challengerAnalysis.score - opponentAnalysis.score);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>MOG BATTLE ⚔️</Text>
        <CoinBalance size="small" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner/Loser reveal */}
        <BattleResult
          winnerName={winnerName}
          winnerScore={winnerAnalysis.score}
          winnerTier={winnerAnalysis.tier.name}
          loserName={loserName}
          loserScore={loserAnalysis.score}
          loserTier={loserAnalysis.tier.name}
          scoreDiff={scoreDiff}
        />

        {/* Category comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown 📊</Text>
          <BattleComparison
            challengerAnalysis={challengerAnalysis}
            opponentAnalysis={opponentAnalysis}
            challengerName="You"
            opponentName="Opponent"
          />
        </View>

        {/* AI Verdict */}
        <View style={{ marginTop: 24 }}>
          <VerdictCard
            challengerScore={challengerAnalysis.score}
            challengerTier={challengerAnalysis.tier.name}
            challengerStrength={challengerAnalysis.strongestRatio.name}
            challengerWeakness={challengerAnalysis.weakestRatio.name}
            opponentScore={opponentAnalysis.score}
            opponentTier={opponentAnalysis.tier.name}
            opponentStrength={opponentAnalysis.strongestRatio.name}
            opponentWeakness={opponentAnalysis.weakestRatio.name}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GlowButton
            title="Share Battle 📤"
            onPress={() => handleShareBattleResult(challengerAnalysis.score, opponentAnalysis.score, challengerWon)}
            variant="secondary"
            size="medium"
          />
          <GlowButton
            title="Rematch 🔄"
            onPress={() => router.push('/scan')}
            variant="outline"
            size="medium"
            color={colors.chad}
          />
        </View>

        <DisclaimerBanner text="Scores are based on mathematical ratios and do not represent actual attractiveness or human value. For entertainment purposes only." />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

async function handleShareBattle(scan: ScanHistoryEntry) {
  try {
    await Share.share({
      message: `I scored ${scan.score.toFixed(1)} (${scan.tierName}) on MogCheck. Think you can mog me? 💀\n\nDownload MogCheck and find out.`,
    });
  } catch {
    // User cancelled
  }
}

async function handleShareBattleResult(score1: number, score2: number, iWon: boolean) {
  try {
    const msg = iWon
      ? `Just mogged someone ${score1.toFixed(1)} to ${score2.toFixed(1)} on MogCheck 💀👑 The golden ratio chose me today.`
      : `Got mogged ${score2.toFixed(1)} to ${score1.toFixed(1)} on MogCheck 😭 The ratios don't lie.`;
    await Share.share({ message: `${msg}\n\nDownload MogCheck and battle your friends.` });
  } catch {
    // User cancelled
  }
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
    paddingHorizontal: 32,
    gap: 12,
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
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.chad,
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  waitingTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    color: colors.chad,
    letterSpacing: 3,
  },
  waitingText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  waitingSubtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pickSection: {
    width: '100%',
    marginTop: 24,
    gap: 8,
  },
  pickTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  pickScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
  },
  pickTier: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  pickDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
