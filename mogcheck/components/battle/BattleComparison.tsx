import { View, Text, StyleSheet } from 'react-native';
import { colors, tierColors } from '../../lib/constants/theme';
import { AnalysisResult, RatioResult } from '../../lib/analysis';

interface BattleComparisonProps {
  challengerAnalysis: AnalysisResult;
  opponentAnalysis: AnalysisResult;
  challengerName: string;
  opponentName: string;
}

interface ComparisonRow {
  label: string;
  challengerValue: number;
  opponentValue: number;
}

export function BattleComparison({
  challengerAnalysis,
  opponentAnalysis,
  challengerName,
  opponentName,
}: BattleComparisonProps) {
  const comparisons: ComparisonRow[] = challengerAnalysis.ratios.map((ratio, i) => ({
    label: ratio.name,
    challengerValue: Math.round(ratio.score * 10 * 10) / 10,
    opponentValue: Math.round(opponentAnalysis.ratios[i].score * 10 * 10) / 10,
  }));

  // Add symmetry row
  comparisons.push({
    label: 'Symmetry',
    challengerValue: Math.round(challengerAnalysis.symmetry.percentage),
    opponentValue: Math.round(opponentAnalysis.symmetry.percentage),
  });

  const challengerWins = comparisons.filter((c) => c.challengerValue > c.opponentValue).length;
  const opponentWins = comparisons.filter((c) => c.opponentValue > c.challengerValue).length;

  return (
    <View style={styles.container}>
      {/* Header names */}
      <View style={styles.headerRow}>
        <Text style={[styles.playerName, { color: tierColors[challengerAnalysis.tier.name] ?? colors.text }]} numberOfLines={1}>
          {challengerName}
        </Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={[styles.playerName, { color: tierColors[opponentAnalysis.tier.name] ?? colors.text }]} numberOfLines={1}>
          {opponentName}
        </Text>
      </View>

      {/* Category wins count */}
      <View style={styles.winsRow}>
        <Text style={[styles.winsCount, { color: colors.primary }]}>{challengerWins}</Text>
        <Text style={styles.winsLabel}>categories won</Text>
        <Text style={[styles.winsCount, { color: colors.chad }]}>{opponentWins}</Text>
      </View>

      {/* Comparison rows */}
      {comparisons.map((row) => {
        const challengerWon = row.challengerValue > row.opponentValue;
        const tie = row.challengerValue === row.opponentValue;

        return (
          <View key={row.label} style={styles.compRow}>
            <Text
              style={[
                styles.compValue,
                challengerWon && styles.compWinner,
                !challengerWon && !tie && styles.compLoser,
              ]}
            >
              {row.challengerValue}
            </Text>
            <Text style={styles.compLabel}>{row.label}</Text>
            <Text
              style={[
                styles.compValue,
                !challengerWon && !tie && styles.compWinner,
                challengerWon && styles.compLoser,
              ]}
            >
              {row.opponentValue}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  playerName: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 12,
    letterSpacing: 3,
  },
  winsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  winsCount: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
  },
  winsLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
  },
  compValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.textMuted,
    width: 50,
    textAlign: 'center',
  },
  compWinner: {
    color: colors.primary,
  },
  compLoser: {
    color: colors.error,
  },
  compLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
