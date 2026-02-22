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

// Multiple placeholder plan sets — rotates each time user spends coins
const PLACEHOLDER_PLANS: PlanData[] = [
  {
    mewing_jaw: "Mewing is free and undefeated. Tongue on the roof of your mouth, lips sealed, teeth lightly touching. Do this 24/7 — not just when you remember. Your jaw-to-face ratio will thank you in 6 months. Also, chew mastic gum for jaw gains. You're welcome.",
    skin: "SPF 50 every single day, even when it's cloudy. Cleanser, moisturizer, SPF — that's the holy trinity. Your face is your moneymaker now, treat it like a high-performance vehicle. Retinol at night if you're 20+. Drink water like your tier depends on it (it does).",
    hair: "Your face shape ratios suggest a style with more volume on top and tapered sides would optimize your proportions. Find a barber who actually consults, not just buzzes. A fresh fade every 2-3 weeks is non-negotiable. Hair is the easiest stat to max out.",
    fitness: "Posture is the free cheat code nobody uses. Shoulders back, chin slightly tucked, neck elongated. Do neck curls and extensions — a thick neck literally changes your face-to-neck ratio. Body composition matters too: lean physique = more defined facial features.",
    style: "Grooming is the multiplier. Clean nails, shaped brows (subtle — don't go full Instagram), well-fitted clothes. Wear colors that contrast with your skin tone. Cologne that's not Axe body spray. These are low-effort, high-impact moves.",
  },
  {
    mewing_jaw: "Hard mewing is a myth that'll wreck your TMJ. Stick to soft mewing: gentle suction hold, posterior third of tongue pressed up. Consistency > intensity. For masseter gains, try falim gum — harder than mastic, cheaper too. 30 min/day, alternating sides.",
    skin: "Double cleansing at night is the play. Oil cleanser first to break down sunscreen and grime, then a gentle water-based cleanser. Niacinamide serum for pores, hyaluronic acid for hydration. Your moisture barrier is your best friend — stop stripping it with harsh products.",
    hair: "Cold water rinse at the end of your shower — closes the cuticle and adds shine. If you're thinning, minoxidil 5% foam is clinically proven. No shame in it, half your favorite celebs use it. Also: biotin supplements are mostly cope, save your money.",
    fitness: "Face pulls and rear delt work fix forward head posture, which literally changes your profile. 3 sets of face pulls every workout. Chin tucks against a wall — 3x10 daily. Your side profile mog potential is being wasted by nerd neck.",
    style: "Accessorize strategically. A quality watch and simple chain draw attention to your best features. Avoid oversized clothing — it hides your frame. Slim-fit (not skinny) is the move. Monochrome outfits make you look taller and more put together.",
  },
  {
    mewing_jaw: "Jawline exercises are 90% genetics, 10% effort — but that 10% matters. Chin tucks strengthen the submental area (goodbye double chin). Try the 'clench and release' method: bite down firmly for 5 seconds, release for 5. 3 sets of 20, twice daily. Pair with mewing for max jaw definition.",
    skin: "Tretinoin is the gold standard — it's prescription retinol on steroids. Start at 0.025% every third night, work up slowly. Your skin will purge for 4-6 weeks, then you ascend. Also: change your pillowcase twice a week. Your face is marinating in bacteria every night.",
    hair: "Scalp health = hair health. Use a salicylic acid shampoo once a week to clear buildup. Consider a derma roller (1.5mm) on your hairline once a week — stimulates blood flow and growth. Look into rice water rinses — sounds like cope but the protein strengthens strands fr.",
    fitness: "Intermittent fasting cuts face fat faster than anything else. 16:8 minimum. The leaner you get, the more your bone structure shows. Below 15% body fat is where jaw definition starts. Below 12% is where you become a different person. Cardio is not optional.",
    style: "Color theory matters more than brands. Find your season (warm/cool/neutral skin undertone) and shop accordingly. Earth tones for warm skin, jewel tones for cool. A $30 shirt in your color beats a $300 one that washes you out. Also: get your clothes tailored. Game changer.",
  },
  {
    mewing_jaw: "Sleep position is the sneaky jaw killer nobody talks about. Sleeping on your side or stomach compresses your face for 8 hours every night. Train yourself to sleep on your back — use a cervical pillow. It preserves symmetry and prevents jaw asymmetry. Mouth tape at night forces nasal breathing and keeps your tongue in mewing position while unconscious.",
    skin: "Chemical exfoliation > physical scrubs. AHA (glycolic acid) for surface texture, BHA (salicylic acid) for pores and acne. Use one 2-3x a week, never both on the same night. Vitamin C serum in the morning under SPF — it boosts sun protection and fades dark spots. Your future self will thank you.",
    hair: "Your hair part should follow your cowlick, not fight it. Deep part on your dominant side opens up your face. If your forehead ratio is high, consider curtain bangs or a textured fringe. If it's low, sweep it back. Hair is the easiest way to rebalance facial thirds without surgery.",
    fitness: "Neck training is the most underrated face hack. Neck curls: lie face up on a bench, hold a plate on your forehead, curl up. 3x15, twice a week. A thick neck makes your jaw look wider relative to your skull. Wrestlers figured this out decades ago. Also: trap development frames your face from below.",
    style: "Glasses/sunglasses are a face shape optimizer. Round face → angular frames. Long face → aviators. Square jaw → round frames. The right pair literally rebalances your ratios. Invest in one quality pair of sunglasses. UV protection is non-negotiable — squinting causes crow's feet.",
  },
  {
    mewing_jaw: "Myofunctional therapy is mewing's evolved form. Find a myofunctional therapist if you're serious — they fix tongue posture, swallowing patterns, and breathing habits that have been ruining your face since childhood. It's what orthodontists don't want you to know. Also, stop mouth breathing during exercise. Tape your mouth during cardio if you have to.",
    skin: "Gut health = skin health. Probiotics (fermented foods or supplements) reduce inflammation that shows up as acne and redness. Cut dairy for 30 days and watch what happens to your skin. Not saying forever — just test it. Also: zinc supplements (15-30mg daily) are clinically proven to reduce acne.",
    hair: "Blow-dry technique matters more than product. Rough dry to 80%, then use a round brush to add volume and direction. Always finish with cool air to set. Use a pre-styler (sea salt spray for texture, volumizing mousse for lift). Your hair should look effortless, which ironically takes effort.",
    fitness: "Lateral raises and shoulder press create the V-taper that frames your face. Wide shoulders make your face look more proportional. 3-4 sets of lateral raises every other day. Don't neglect cardio though — sub-15% body fat is where facial aesthetics actually show. Your jawline is hiding under face fat.",
    style: "Scent is the invisible accessory. Find 2-3 fragrances: one fresh for daytime (citrus/aquatic), one warm for evening (woody/amber), one signature. Apply to pulse points — wrists, neck, behind ears. Compliment-getter fragrances exist and they're documented online. This is a real stat boost that most guys ignore.",
  },
];

/**
 * Build a randomized plan by picking a random entry PER CATEGORY
 * from the 5 placeholder plans, so each generated plan is unique.
 */
function buildRandomPlan(): PlanData {
  const pick = (key: keyof PlanData) => {
    const options = PLACEHOLDER_PLANS.map(p => p[key]).filter(Boolean);
    return options[Math.floor(Math.random() * options.length)];
  };
  return {
    mewing_jaw: pick('mewing_jaw'),
    skin: pick('skin'),
    hair: pick('hair'),
    fitness: pick('fitness'),
    style: pick('style'),
  };
}

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
          setPlan(buildRandomPlan());
        }
      } else {
        const spent = await spendCoins(2, 'ascension');
        if (!spent) {
          setError('Not enough coins');
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
        setPlan(buildRandomPlan());
      }
    } catch {
      setPlan(buildRandomPlan());
    } finally {
      setLoading(false);
    }
  };

  if (plan) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: tierColor }]}>ASCENSION PLAN 📈</Text>

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
      <Text style={styles.ctaTitle}>ASCENSION PLAN 📈</Text>
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
