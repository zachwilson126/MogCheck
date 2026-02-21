import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { colors, tierColors } from '../../lib/constants/theme';

interface BattleResultProps {
  winnerName: string;
  winnerScore: number;
  winnerTier: string;
  loserName: string;
  loserScore: number;
  loserTier: string;
  scoreDiff: number;
}

export function BattleResult({
  winnerName,
  winnerScore,
  winnerTier,
  loserName,
  loserScore,
  loserTier,
  scoreDiff,
}: BattleResultProps) {
  const stampScale = useSharedValue(0);
  const stampRotation = useSharedValue(-15);

  useEffect(() => {
    stampScale.value = withDelay(
      600,
      withSequence(
        withSpring(1.3, { damping: 4, stiffness: 200 }),
        withSpring(1.0, { damping: 8 }),
      ),
    );
    stampRotation.value = withDelay(
      600,
      withSequence(
        withTiming(-20, { duration: 100 }),
        withSpring(-8, { damping: 6 }),
      ),
    );
  }, []);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stampScale.value },
      { rotate: `${stampRotation.value}deg` },
    ],
  }));

  const winnerColor = tierColors[winnerTier] ?? colors.primary;
  const mogText = scoreDiff >= 2 ? 'GIGAMOGGED' : scoreDiff >= 1 ? 'MOGGED' : 'EDGED OUT';

  return (
    <View style={styles.container}>
      {/* Winner side */}
      <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.winnerCard}>
        <Text style={styles.crownEmoji}>{'👑'}</Text>
        <Text style={[styles.winnerName, { color: winnerColor }]}>{winnerName}</Text>
        <Text style={[styles.winnerScore, { color: winnerColor }]}>{winnerScore.toFixed(1)}</Text>
        <Text style={[styles.winnerTier, { color: winnerColor }]}>{winnerTier}</Text>
      </Animated.View>

      {/* MOG stamp */}
      <Animated.View style={[styles.stampContainer, stampStyle]}>
        <View style={[styles.stamp, { borderColor: winnerColor }]}>
          <Text style={[styles.stampText, { color: winnerColor }]}>{mogText}</Text>
        </View>
      </Animated.View>

      {/* Loser side */}
      <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.loserCard}>
        <Text style={styles.loserName}>{loserName}</Text>
        <Text style={styles.loserScore}>{loserScore.toFixed(1)}</Text>
        <Text style={styles.loserTier}>{loserTier}</Text>
      </Animated.View>

      {/* Score diff */}
      <Animated.View entering={ZoomIn.delay(800).duration(400)}>
        <Text style={styles.diffText}>
          {scoreDiff.toFixed(1)} point{scoreDiff >= 2 ? '' : ''} difference
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  winnerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  crownEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  winnerName: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 2,
  },
  winnerScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 56,
  },
  winnerTier: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  stampContainer: {
    marginVertical: -8,
  },
  stamp: {
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  stampText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 4,
  },
  loserCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '60%',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loserName: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  loserScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
    color: colors.textMuted,
  },
  loserTier: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
  },
  diffText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
});
