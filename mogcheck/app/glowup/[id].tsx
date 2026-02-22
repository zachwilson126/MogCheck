import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '../../lib/constants/theme';
import { useUserStore } from '../../lib/store/useUserStore';
import { generateTransform } from '../../lib/api/supabase';
import { GlowButton } from '../../components/shared/GlowButton';
import { CoinBalance } from '../../components/store/CoinBalance';
import { BeforeAfterSlider } from '../../components/results/BeforeAfterSlider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 32;
const COIN_COST = 5;

export default function GlowUpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scanHistory = useUserStore((s) => s.scanHistory);
  const coins = useUserStore((s) => s.coins);
  const spendCoins = useUserStore((s) => s.spendCoins);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const [loading, setLoading] = useState(false);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = scanHistory.find((s) => s.id === id);

  if (!scan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Scan not found</Text>
          <GlowButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, photoUri } = scan;
  const tierColor = analysis.tier.color;

  const handleGlowUp = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Account Required',
        'Sign in to use the Glow Up feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') },
        ],
      );
      return;
    }

    if (coins < COIN_COST) {
      Alert.alert(
        'Not Enough Coins',
        `Glow Up costs ${COIN_COST} coins. You have ${coins}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Coins', onPress: () => router.push('/store') },
        ],
      );
      return;
    }

    if (!photoUri) {
      Alert.alert(
        'Photo Not Available',
        'The original photo for this scan is no longer available. Please do a new scan to use Glow Up.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Verify photo file actually exists on disk (temp files get cleaned by iOS)
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      Alert.alert(
        'Photo Expired',
        'The photo file has been cleaned up by the system. Please do a new scan to use Glow Up.',
        [{ text: 'OK' }],
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Spend coins locally first
      const spent = await spendCoins(COIN_COST, 'transform');
      if (!spent) {
        setError('Failed to spend coins. Please try again.');
        setLoading(false);
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await generateTransform(photoUri, {
        score: analysis.score,
        tier: analysis.tier.name,
        weakestRatios: analysis.bottomRatios.map((r) => ({ name: r.name, score: r.score })),
        symmetryScore: Math.round(analysis.symmetry.percentage),
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.transformedImage) {
        setTransformedImage(`data:image/png;base64,${result.transformedImage}`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError('No image was generated. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>GLOW UP ✨</Text>
        <CoinBalance size="small" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Result: Before/After Slider */}
        {transformedImage && photoUri ? (
          <>
            <BeforeAfterSlider
              beforeUri={photoUri}
              afterUri={transformedImage}
              width={SLIDER_WIDTH}
            />

            <View style={styles.disclaimerCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.warning} />
              <Text style={styles.disclaimerText}>
                AI-generated image. For entertainment only. Does not represent achievable results through any procedure.
              </Text>
            </View>

            <View style={styles.actions}>
              <GlowButton
                title="Back to Results"
                onPress={() => router.back()}
                variant="outline"
                size="medium"
                color={tierColor}
              />
            </View>
          </>
        ) : (
          <>
            {/* Preview: Original Photo */}
            {photoUri ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <View style={styles.previewOverlay}>
                  <Text style={[styles.previewScore, { color: tierColor }]}>
                    {analysis.score.toFixed(1)}
                  </Text>
                  <Text style={[styles.previewTier, { color: tierColor }]}>
                    {analysis.tier.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noPhotoCard}>
                <MaterialCommunityIcons name="image-off" size={48} color={colors.textMuted} />
                <Text style={styles.noPhotoText}>Original photo not available</Text>
                <Text style={styles.noPhotoSubtext}>Do a new scan to use Glow Up</Text>
              </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="auto-fix" size={28} color={colors.primary} />
              <Text style={styles.infoTitle}>AI Enhancement Preview</Text>
              <Text style={styles.infoDescription}>
                See what subtle improvements to your weakest ratios could look like.
                Our AI will enhance{' '}
                {analysis.bottomRatios
                  .slice(0, 2)
                  .map((r) => r.name.toLowerCase())
                  .join(' and ')}
                {' '}proportions while keeping your identity.
              </Text>
              <View style={styles.costRow}>
                <MaterialCommunityIcons name="circle-multiple" size={18} color="#FFD700" />
                <Text style={styles.costText}>{COIN_COST} coins</Text>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorCardText}>{error}</Text>
              </View>
            )}

            {/* Generate Button */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>cooking ur glow up... 🧑‍🍳</Text>
                <Text style={styles.loadingSubtext}>This may take 10-20 seconds</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <GlowButton
                  title={`Generate Glow Up (${COIN_COST} coins)`}
                  onPress={handleGlowUp}
                  size="large"
                  pulsing
                  disabled={!photoUri}
                />
                <GlowButton
                  title="Back"
                  onPress={() => router.back()}
                  variant="outline"
                  size="medium"
                  color={colors.textSecondary}
                />
              </View>
            )}

            {/* Disclaimer */}
            <Text style={styles.footerDisclaimer}>
              AI-generated images are for entertainment only and do not represent achievable results through any cosmetic or surgical procedure.
            </Text>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  previewContainer: {
    width: SLIDER_WIDTH,
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
  },
  previewTier: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
  },
  noPhotoCard: {
    width: SLIDER_WIDTH,
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noPhotoText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  noPhotoSubtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  infoDescription: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  costText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#FFD700',
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorCardText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  loadingSubtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  actions: {
    paddingVertical: 20,
    gap: 12,
    alignItems: 'center',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.warning,
    lineHeight: 18,
  },
  footerDisclaimer: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
});
