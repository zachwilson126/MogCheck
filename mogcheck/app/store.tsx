import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Product } from 'react-native-iap';
import { colors } from '../lib/constants/theme';
import { CoinBalance } from '../components/store/CoinBalance';
import { GlowButton } from '../components/shared/GlowButton';
import { useUserStore } from '../lib/store/useUserStore';
import { COIN_PACKS, GIFT_PACKS, FEATURE_COSTS, CoinPack, GiftPack } from '../lib/constants/iap';
import { loadProducts, purchaseCoinPack, initIAP } from '../lib/api/iap';

export default function StoreScreen() {
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showGifts, setShowGifts] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initIAP();
      const loaded = await loadProducts();
      setProducts(loaded);
    };
    setup();
  }, []);

  const handlePurchase = async (productId: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Account Required',
        'Create an account to purchase coins. Your coins will sync across devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/auth') },
        ],
      );
      return;
    }

    setPurchasing(productId);
    try {
      await purchaseCoinPack(productId);
    } catch {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>COIN STORE</Text>
        <CoinBalance size="small" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Feature Costs Reference */}
        <View style={styles.costRef}>
          <Text style={styles.costRefTitle}>What coins get you:</Text>
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
          {/* Glow Up — coming in v1.1 */}
        </View>

        {/* Coin Packs */}
        <Text style={styles.sectionTitle}>Coin Packs</Text>
        <View style={styles.packsGrid}>
          {COIN_PACKS.map((pack) => (
            <CoinPackCard
              key={pack.productId}
              pack={pack}
              product={products.find((p) => p.id === pack.productId)}
              purchasing={purchasing === pack.productId}
              onPurchase={() => handlePurchase(pack.productId)}
            />
          ))}
        </View>

        {/* Gift Section */}
        <Pressable style={styles.giftHeader} onPress={() => setShowGifts(!showGifts)}>
          <View style={styles.giftHeaderLeft}>
            <MaterialCommunityIcons name="gift" size={22} color={colors.chad} />
            <Text style={styles.sectionTitle}>Gift Coins</Text>
          </View>
          <MaterialCommunityIcons
            name={showGifts ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        {showGifts && (
          <View style={styles.packsGrid}>
            {GIFT_PACKS.map((pack) => (
              <GiftPackCard
                key={pack.productId}
                pack={pack}
                product={products.find((p) => p.id === pack.productId)}
                purchasing={purchasing === pack.productId}
                onPurchase={() => handlePurchase(pack.productId)}
              />
            ))}
          </View>
        )}

        {/* Legal */}
        <Text style={styles.legalText}>
          Coins are consumable and non-refundable. Coins cannot be exchanged, sold, or converted to real currency. All purchases are processed by Apple. Gift refunds go to the original purchaser only.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CoinPackCard({
  pack,
  product,
  purchasing,
  onPurchase,
}: {
  pack: CoinPack;
  product?: Product;
  purchasing: boolean;
  onPurchase: () => void;
}) {
  const displayPrice = product?.displayPrice ?? pack.price;

  return (
    <View style={[styles.packCard, pack.isPopular && styles.packCardPopular]}>
      {pack.isPopular && <Text style={styles.popularBadge}>POPULAR</Text>}
      <Text style={styles.packName}>{pack.name}</Text>
      <View style={styles.coinRow}>
        <MaterialCommunityIcons name="circle-multiple" size={20} color="#FFD700" />
        <Text style={styles.coinAmount}>{pack.coins}</Text>
      </View>
      <Text style={styles.packBestFor}>{pack.bestFor}</Text>
      <GlowButton
        title={purchasing ? '...' : displayPrice}
        onPress={onPurchase}
        size="small"
        disabled={purchasing}
        style={{ width: '100%' }}
      />
    </View>
  );
}

function GiftPackCard({
  pack,
  product,
  purchasing,
  onPurchase,
}: {
  pack: GiftPack;
  product?: Product;
  purchasing: boolean;
  onPurchase: () => void;
}) {
  const displayPrice = product?.displayPrice ?? pack.price;

  return (
    <View style={styles.packCard}>
      <MaterialCommunityIcons name="gift" size={24} color={colors.chad} style={{ alignSelf: 'center' }} />
      <Text style={styles.packName}>{pack.name}</Text>
      <Text style={styles.giftTagline}>"{pack.tagline}"</Text>
      <View style={styles.coinRow}>
        <MaterialCommunityIcons name="circle-multiple" size={16} color="#FFD700" />
        <Text style={styles.coinAmount}>{pack.coins}</Text>
      </View>
      <GlowButton
        title={purchasing ? '...' : displayPrice}
        onPress={onPurchase}
        size="small"
        variant="outline"
        color={colors.chad}
        disabled={purchasing}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: colors.text,
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  costRef: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  costRefTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costItem: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.text,
  },
  costValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#FFD700',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  packCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '47%',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packCardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  packName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coinAmount: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: '#FFD700',
  },
  packBestFor: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  giftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  giftTagline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  legalText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
