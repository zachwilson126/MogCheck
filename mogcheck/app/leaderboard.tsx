import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tierColors } from '../lib/constants/theme';
import { CoinBalance } from '../components/store/CoinBalance';
import { GlowButton } from '../components/shared/GlowButton';
import { useUserStore } from '../lib/store/useUserStore';
import {
  getLeaderboard,
  getLeaderboardEntry,
  upsertLeaderboardEntry,
  removeFromLeaderboard,
} from '../lib/api/supabase';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  highest_score: number;
  tier: string;
  updated_at: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { isAuthenticated, user, username, highestScore, currentTier } = useUserStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [optedIn, setOptedIn] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await getLeaderboard(100);
    if (data) {
      setEntries(data as LeaderboardEntry[]);
    }

    if (isAuthenticated && user) {
      const { data: entry } = await getLeaderboardEntry(user.id);
      if (entry) {
        setOptedIn(entry.opted_in);
      }
    }
    setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleOptIn = async (value: boolean) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Account Required',
        'Create an account to join the leaderboard.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/auth') },
        ],
      );
      return;
    }

    if (!username) {
      Alert.alert('Username Required', 'Set a username in Settings before joining the leaderboard.');
      return;
    }

    setToggling(true);
    try {
      if (value) {
        await upsertLeaderboardEntry(user.id, username, highestScore, currentTier ?? 'MID');
        setOptedIn(true);
      } else {
        await removeFromLeaderboard(user.id);
        setOptedIn(false);
      }
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to update leaderboard status.');
    } finally {
      setToggling(false);
    }
  };

  const myRank = user ? entries.findIndex((e) => e.user_id === user.id) + 1 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>LEADERBOARD</Text>
        <CoinBalance size="small" />
      </View>

      {/* Opt-in toggle */}
      <View style={styles.optInRow}>
        <View style={styles.optInLeft}>
          <MaterialCommunityIcons name="trophy" size={20} color={colors.chad} />
          <Text style={styles.optInText}>Show my score publicly</Text>
        </View>
        <Switch
          value={optedIn}
          onValueChange={handleToggleOptIn}
          disabled={toggling}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      {/* My rank */}
      {optedIn && myRank > 0 && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>YOUR RANK</Text>
          <Text style={styles.myRankValue}>#{myRank}</Text>
        </View>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="trophy-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No one on the leaderboard yet</Text>
          <Text style={styles.emptySubtext}>Be the first to opt in</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const rank = index + 1;
            const isMe = user?.id === item.user_id;
            const tierColor = tierColors[item.tier] ?? colors.text;

            return (
              <View style={[styles.entryRow, isMe && styles.entryRowMe]}>
                <Text style={[styles.rank, rank <= 3 && { color: colors.chad }]}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                </Text>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, isMe && { color: colors.primary }]}>
                    {item.username}{isMe ? ' (you)' : ''}
                  </Text>
                  <Text style={[styles.entryTier, { color: tierColor }]}>{item.tier}</Text>
                </View>
                <Text style={[styles.entryScore, { color: tierColor }]}>
                  {item.highest_score.toFixed ? item.highest_score.toFixed(1) : item.highest_score}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Leaderboard shows highest scores only. No photos are shared. Opt out at any time.
      </Text>
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
  optInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optInText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  myRankLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  myRankValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    gap: 12,
  },
  entryRowMe: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rank: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  entryTier: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  entryScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
  },
  disclaimer: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});
