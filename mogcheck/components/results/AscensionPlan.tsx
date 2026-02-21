import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/constants/theme';
import { GlowButton } from '../shared/GlowButton';
import { DisclaimerBanner } from '../shared/DisclaimerBanner';
import { useUserStore } from '../../lib/store/useUserStore';
import { generateAscensionPlan } from '../../lib/api/supabase';
import { AnalysisResult } from '../../lib/analysis';

interface AscensionPlanProps {
  analysis: AnalysisResult;
  tierColor: string;
}

interface PlanData {
  mewing_jaw?: string;
  skin?: string;
  hair?: string;
  fitness?: string;
  style?: string;
  general?: string;
}

const PLAN_CATEGORIES: { key: keyof PlanData; icon: string; title: string }[] = [
  { key: 'mewing_jaw', icon: 'face-man-shimmer', title: 'Mewing & Jaw' },
  { key: 'skin', icon: 'water', title: 'Skin' },
  { key: 'hair', icon: 'hair-dryer', title: 'Hair' },
  { key: 'fitness', icon: 'dumbbell', title: 'Fitness' },
  { key: 'style', icon: 'tshirt-crew', title: 'Style' },
];

// Placeholder plans for when API isn't connected
const PLACEHOLDER_PLANS: Record<string, PlanData> = {
  default: {
    mewing_jaw: "Mewing is free and undefeated. Tongue on the roof of your mouth, lips sealed, teeth lightly touching. Do this 24/7 — not just when you remember. Your jaw-to-face ratio will thank you in 6 months. Also, chew mastic gum for jaw gains. You're welcome.",
    skin: "SPF 50 every single day, even when it's cloudy. Cleanser, moisturizer, SPF — that's the holy trinity. Your face is your moneymaker now, treat it like a high-performance vehicle. Retinol at night if you're 20+. Drink water like your tier depends on it (it does).",
    hair: "Your face shape ratios suggest a style with more volume on top and tapered sides would optimize your proportions. Find a barber who actually consults, not just buzzes. A fresh fade every 2-3 weeks is non-negotiable. Hair is the easiest stat to max out.",
    fitness: "Posture is the free cheat code nobody uses. Shoulders back, chin slightly tucked, neck elongated. Do neck curls and extensions — a thick neck literally changes your face-to-neck ratio. Body composition matters too: lean physique = more defined facial features.",
    style: "Grooming is the multiplier. Clean nails, shaped brows (subtle — don't go full Instagram), well-fitted clothes. Wear colors that contrast with your skin tone. Cologne that's not Axe body spray. These are low-effort, high-impact moves.",
  },
};

export function AscensionPlan({ analysis, tierColor }: AscensionPlanProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coins = useUserStore((s) => s.coins);
  const spendCoins = useUserStore((s) => s.spendCoins);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const handleGetPlan = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isAuthenticated) {
        const spent = await spendCoins(2, 'ascension');
        if (!spent) {
          setError('Not enough coins');
          setLoading(false);
          return;
        }

        const result = await generateAscensionPlan({
          score: analysis.score,
          tier: analysis.tier.name,
          weakestRatios: analysis.bottomRatios.map((r) => ({
            name: r.name,
            score: Math.round(r.score * 10 * 10) / 10,
          })),
          symmetryScore: Math.round(analysis.symmetry.percentage),
          facialThirds: analysis.facialThirds,
        });

        if (result.plan && typeof result.plan === 'object') {
          setPlan(result.plan as unknown as PlanData);
        } else {
          setPlan(PLACEHOLDER_PLANS.default);
        }
      } else {
        const spent = await spendCoins(2, 'ascension');
        if (!spent) {
          setError('Not enough coins');
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
        setPlan(PLACEHOLDER_PLANS.default);
      }
    } catch {
      setPlan(PLACEHOLDER_PLANS.default);
    } finally {
      setLoading(false);
    }
  };

  if (plan) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: tierColor }]}>ASCENSION PLAN</Text>

        {PLAN_CATEGORIES.map((cat) => {
          const content = plan[cat.key];
          if (!content) return null;
          return (
            <View key={cat.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons
                  name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20}
                  color={tierColor}
                />
                <Text style={[styles.categoryTitle, { color: tierColor }]}>{cat.title}</Text>
              </View>
              <Text style={styles.categoryText}>{content}</Text>
            </View>
          );
        })}

        {plan.general && (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryText}>{plan.general}</Text>
          </View>
        )}

        <DisclaimerBanner text="Entertainment only. Not medical advice. Consult a professional before making changes to your health, fitness, or grooming routine." />
      </View>
    );
  }

  return (
    <View style={styles.ctaCard}>
      <Text style={styles.ctaTitle}>ASCENSION PLAN</Text>
      <Text style={styles.ctaDescription}>
        Personalized (and actually helpful) improvement tips for your specific ratios.
      </Text>
      <GlowButton
        title={loading ? 'Generating...' : 'Get Your Plan (2 coins)'}
        onPress={handleGetPlan}
        variant="outline"
        size="small"
        color={tierColor}
        disabled={loading || coins < 2}
      />
      {coins < 2 && (
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
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  categoryText: {
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
