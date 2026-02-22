import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/constants/theme';
import { GlowButton } from '../shared/GlowButton';
import { useUserStore } from '../../lib/store/useUserStore';
import { generateBattleVerdict } from '../../lib/api/supabase';

interface VerdictCardProps {
  challengerScore: number;
  challengerTier: string;
  challengerStrength: string;
  challengerWeakness: string;
  opponentScore: number;
  opponentTier: string;
  opponentStrength: string;
  opponentWeakness: string;
}

export function VerdictCard({
  challengerScore,
  challengerTier,
  challengerStrength,
  challengerWeakness,
  opponentScore,
  opponentTier,
  opponentStrength,
  opponentWeakness,
}: VerdictCardProps) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coins = useUserStore((s) => s.coins);
  const spendCoins = useUserStore((s) => s.spendCoins);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const handleGetVerdict = async () => {
    setError(null);
    setLoading(true);

    try {
      const spent = await spendCoins(1, 'battle_verdict');
      if (!spent) {
        setError('Not enough coins');
        setLoading(false);
        return;
      }

      if (isAuthenticated) {
        const result = await generateBattleVerdict({
          challengerScore,
          challengerTier,
          opponentScore,
          opponentTier,
          challengerStrength,
          challengerWeakness,
          opponentStrength,
          opponentWeakness,
          scoreDifference: Math.abs(challengerScore - opponentScore),
        });

        if (result.verdict) {
          setVerdict(result.verdict);
        } else {
          setVerdict(getPlaceholderVerdict(challengerScore, opponentScore));
        }
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setVerdict(getPlaceholderVerdict(challengerScore, opponentScore));
      }
    } catch {
      setVerdict(getPlaceholderVerdict(challengerScore, opponentScore));
    } finally {
      setLoading(false);
    }
  };

  if (verdict) {
    return (
      <View style={styles.verdictContainer}>
        <View style={styles.verdictHeader}>
          <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
          <Text style={styles.verdictTitle}>AI VERDICT 🤖</Text>
        </View>
        <Text style={styles.verdictText}>{verdict}</Text>
      </View>
    );
  }

  return (
    <View style={styles.ctaCard}>
      <Text style={styles.ctaTitle}>AI VERDICT 🤖</Text>
      <Text style={styles.ctaDescription}>Get a brutally honest battle commentary</Text>
      <GlowButton
        title={loading ? 'Judging...' : 'Get Verdict (1 coin)'}
        onPress={handleGetVerdict}
        variant="outline"
        size="small"
        color={colors.chad}
        disabled={loading || coins < 1}
      />
      {coins < 1 && (
        <GlowButton
          title="Get Coins"
          onPress={() => router.push('/store')}
          variant="outline"
          size="small"
          color={colors.primary}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function getPlaceholderVerdict(score1: number, score2: number): string {
  const diff = Math.abs(score1 - score2);
  if (diff >= 3) {
    return "This wasn't even close. One of you is built different and the other is just... built. The facial ratios don't lie and today they chose violence. Absolute mog. No cap.";
  }
  if (diff >= 1.5) {
    return "A solid mog but not a demolition. Winner had better proportions across the board but the loser isn't out of the game. One good mewing arc could flip this. The grind continues fr fr.";
  }
  if (diff >= 0.5) {
    return "This was CLOSE. Like, mathematically almost identical. The winner edged it out by the slimmest of margins. A rematch could easily go the other way. Both of you are lowkey the same tier ong.";
  }
  return "Bro this is basically a tie. The golden ratio said 'I cannot choose between you.' Both of you are operating at essentially the same facial geometry tier. Touch grass and call it a draw.";
}

const styles = StyleSheet.create({
  verdictContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: colors.primary,
    letterSpacing: 2,
  },
  verdictText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    alignItems: 'center',
  },
  ctaTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  ctaDescription: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },
});
