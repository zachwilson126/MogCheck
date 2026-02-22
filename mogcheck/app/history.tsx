import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tierColors } from '../lib/constants/theme';
import { useUserStore } from '../lib/store/useUserStore';

export default function HistoryScreen() {
  const router = useRouter();
  const scanHistory = useUserStore((s) => s.scanHistory);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>SCAN HISTORY 📋</Text>
        <View style={{ width: 40 }} />
      </View>

      {scanHistory.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="history" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>no data on u yet 👀</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {scanHistory.map((scan) => (
            <Pressable
              key={scan.id}
              style={styles.card}
              onPress={() => router.push(`/results/${scan.id}`)}
            >
              <View style={styles.cardLeft}>
                <Text style={[styles.score, { color: tierColors[scan.tierName] ?? colors.text }]}>
                  {scan.score.toFixed(1)}
                </Text>
                <View>
                  <Text style={[styles.tier, { color: tierColors[scan.tierName] ?? colors.textSecondary }]}>
                    {scan.tierName}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(scan.analyzedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  score: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
  },
  tier: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
  },
  date: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
