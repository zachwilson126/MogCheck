import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../lib/constants/theme';
import { useUserStore } from '../lib/store/useUserStore';
import { GlowButton } from '../components/shared/GlowButton';
import { CoinBalance } from '../components/store/CoinBalance';
import { DisclaimerModal } from '../components/shared/DisclaimerBanner';
import { tierColors } from '../lib/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { scanHistory, highestScore, currentTier, totalScans } = useUserStore();

  return (
    <SafeAreaView style={styles.container}>
      <DisclaimerModal />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MOGCHECK</Text>
        <CoinBalance />
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <GlowButton
          title="SCAN YOUR FACE"
          onPress={() => router.push('/scan')}
          size="large"
          pulsing
          style={styles.scanButton}
        />
        <GlowButton
          title="MOG BATTLE"
          onPress={() => {
            if (scanHistory.length > 0) {
              router.push(`/battle/${scanHistory[0].id}`);
            } else {
              router.push('/scan');
            }
          }}
          variant="outline"
          size="medium"
          color={colors.chad}
          style={styles.battleButton}
        />
      </View>

      {/* Stats Bar */}
      {totalScans > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, currentTier ? { color: tierColors[currentTier] ?? colors.text } : undefined]}>
              {highestScore > 0 ? highestScore.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, currentTier ? { color: tierColors[currentTier] ?? colors.text } : undefined]}>
              {currentTier ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
        </View>
      )}

      {/* Recent Scans */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {scanHistory.length > 0 && (
            <Pressable onPress={() => router.push('/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          )}
        </View>

        {scanHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="face-recognition" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>Tap "Scan Your Face" to get started</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {scanHistory.slice(0, 5).map((scan) => (
              <Pressable
                key={scan.id}
                style={styles.historyCard}
                onPress={() => router.push(`/results/${scan.id}`)}
              >
                <View style={styles.historyLeft}>
                  <Text style={[styles.historyScore, { color: tierColors[scan.tierName] ?? colors.text }]}>
                    {scan.score.toFixed(1)}
                  </Text>
                  <Text style={[styles.historyTier, { color: tierColors[scan.tierName] ?? colors.textSecondary }]}>
                    {scan.tierName}
                  </Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(scan.analyzedAt).toLocaleDateString()}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push('/store')}>
          <MaterialCommunityIcons name="store" size={24} color="#FFD700" />
          <Text style={styles.navLabel}>Store</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/leaderboard')}>
          <MaterialCommunityIcons name="trophy" size={24} color={colors.chad} />
          <Text style={styles.navLabel}>Ranks</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/history')}>
          <MaterialCommunityIcons name="history" size={24} color={colors.textMuted} />
          <Text style={styles.navLabel}>History</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/settings')}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.textMuted} />
          <Text style={styles.navLabel}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
    color: colors.primary,
    letterSpacing: 2,
  },
  mainActions: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  scanButton: {
    width: '80%',
  },
  battleButton: {
    width: '60%',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 0,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  seeAll: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
  },
  historyTier: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  historyDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
