import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/constants/theme';
import { GlowButton } from '../shared/GlowButton';
import { useUserStore } from '../../lib/store/useUserStore';
import { getPlaceholderRoast } from '../../lib/constants/roastPrompts';
import { generateRoast } from '../../lib/api/supabase';
import { AnalysisResult } from '../../lib/analysis';
import { useState } from 'react';

interface RoastCardProps {
  tierName: string;
  tierColor: string;
  analysis: AnalysisResult;
}

export function RoastCard({ tierName, tierColor, analysis }: RoastCardProps) {
  const router = useRouter();
  const [roastText, setRoastText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coins = useUserStore((s) => s.coins);
  const spendCoins = useUserStore((s) => s.spendCoins);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const handleGetRoast = async () => {
    setError(null);
    setLoading(true);

    try {
      // Try server-side Claude API if authenticated
      if (isAuthenticated) {
        const spent = await spendCoins(1, 'roast');
        if (!spent) {
          setError('Not enough coins');
          setLoading(false);
          return;
        }

        const result = await generateRoast({
          score: analysis.score,
          tier: analysis.tier.name,
          strongestRatio: {
            name: analysis.strongestRatio.name,
            score: Math.round(analysis.strongestRatio.score * 10 * 10) / 10,
          },
          weakestRatio: {
            name: analysis.weakestRatio.name,
            score: Math.round(analysis.weakestRatio.score * 10 * 10) / 10,
          },
          symmetryScore: Math.round(analysis.symmetry.percentage),
          facialThirds: analysis.facialThirds,
          topRatios: analysis.topRatios.map((r) => ({
            name: r.name,
            score: Math.round(r.score * 10 * 10) / 10,
          })),
          bottomRatios: analysis.bottomRatios.map((r) => ({
            name: r.name,
            score: Math.round(r.score * 10 * 10) / 10,
          })),
        });

        if (result.roastText) {
          setRoastText(result.roastText);
        } else {
          // Fallback to placeholder on API error
          setRoastText(getPlaceholderRoast(tierName));
        }
      } else {
        // Not authenticated — use placeholder roasts (still costs local coins)
        const localSpent = await spendCoins(1, 'roast');
        if (!localSpent) {
          setError('Not enough coins');
          setLoading(false);
          return;
        }
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 1500));
        setRoastText(getPlaceholderRoast(tierName));
      }
    } catch (err) {
      // Fallback on any failure
      setRoastText(getPlaceholderRoast(tierName));
    } finally {
      setLoading(false);
    }
  };

  if (roastText) {
    return (
      <View style={[styles.card, { borderColor: tierColor }]}>
        <Text style={styles.label}>AI ROAST 🔥</Text>
        <Text style={styles.roastText}>{roastText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>WANT TO GET ROASTED? 💀</Text>
      <Text style={styles.description}>
        AI-generated personalized commentary based on your specific ratios.
      </Text>
      <GlowButton
        title={loading ? 'Generating...' : 'Get Roasted (1 coin)'}
        onPress={handleGetRoast}
        variant="outline"
        size="small"
        color={tierColor}
        disabled={loading || coins < 1}
      />
      {coins < 1 && (
        <View style={styles.noCoinRow}>
          <Text style={styles.noCoinText}>Not enough coins</Text>
          <GlowButton
            title="Get Coins"
            onPress={() => router.push('/store')}
            variant="outline"
            size="small"
            color={colors.primary}
          />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  label: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  description: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  roastText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  noCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noCoinText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.error,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },
});
