import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../lib/constants/theme';
import { useUserStore } from '../lib/store/useUserStore';
import { COIN_PACKS, GIFT_PACKS, FEATURE_COSTS, CoinPack, GiftPack } from '../lib/constants/iap';

export default function StoreScreen() {
  const router = useRouter();
  const coins = useUserStore((s) => s.coins);

  const handleOfflineTap = () => {
    Alert.alert(
      'Purchases Unavailable',
      'Coin purchases are not available in this version of MogCheck.',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>coin store</Text>
        <View style={styles.coinPill}>
          <MaterialCommunityIcons name="circle-multiple" size={16} color="#FFD700" />
          <Text style={styles.coinPillText}>{coins}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>Coin purchases unavailable</Text>
          <Text style={styles.warningText}>
            You can still use your current coin balance for premium actions.
          </Text>
        </View>

        <View style={styles.costRef}>
          <Text style={styles.costRefTitle}>What coins get you</Text>
          <View style={styles.costRow}>
            <Text style={styles.costItem}>AI Roast</Text>
            <Text style={styles.costValue}>{FEATURE_COSTS.roast} coin</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costItem}>Battle Verdict</Text>
            <Text style={styles.costValue}>{FEATURE_COSTS.battle_verdict} coin</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costItem}>Ascension Plan</Text>
            <Text style={styles.costValue}>{FEATURE_COSTS.ascension_plan} coins</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Coin Packs</Text>
        <View style={styles.cards}>
          {COIN_PACKS.map((pack) => (
            <StoreCard
              key={pack.productId}
              name={pack.name}
              subtitle={pack.bestFor}
              coins={pack.coins}
              price={pack.price}
              popular={!!pack.isPopular}
              onPress={handleOfflineTap}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Gift Packs</Text>
        <View style={styles.cards}>
          {GIFT_PACKS.map((pack) => (
            <GiftCard
              key={pack.productId}
              pack={pack}
              onPress={handleOfflineTap}
            />
          ))}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Purchase status</Text>
          <Text style={styles.footerText}>
            In-app purchases are not included in this version.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StoreCard({
  name,
  subtitle,
  coins,
  price,
  popular,
  onPress,
}: {
  name: string;
  subtitle: string;
  coins: number;
  price: string;
  popular: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        popular && styles.cardPopular,
        pressed && styles.cardPressed,
      ]}
    >
      {popular && <Text style={styles.popularBadge}>popular</Text>}
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <View style={styles.coinRow}>
        <MaterialCommunityIcons name="circle-multiple" size={18} color="#FFD700" />
        <Text style={styles.coinAmount}>{coins}</Text>
      </View>
      <Text style={styles.price}>{price}</Text>
    </Pressable>
  );
}

function GiftCard({
  pack,
  onPress,
}: {
  pack: GiftPack;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardTitle}>{pack.name}</Text>
      <Text style={styles.cardSubtitle}>{pack.tagline}</Text>
      <View style={styles.coinRow}>
        <MaterialCommunityIcons name="circle-multiple" size={18} color="#FFD700" />
        <Text style={styles.coinAmount}>{pack.coins}</Text>
      </View>
      <Text style={styles.price}>{pack.price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  coinPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  warningTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#FFD166',
  },
  warningText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  costRef: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  costRefTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costItem: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  costValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8,
  },
  cardPopular: {
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.82,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    color: colors.background,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinAmount: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  price: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: colors.primary,
    letterSpacing: 1,
  },
  footerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  footerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
