import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, tierColors } from '../../lib/constants/theme';
import { useScreenShake } from '../../lib/hooks/useScreenShake';

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
  const stampScale = useRef(new Animated.Value(0)).current;
  const stampRotation = useRef(new Animated.Value(-15)).current;
  const { shakeX, triggerShake } = useScreenShake();

  useEffect(() => {
    const reveal = Animated.delay(600);
    const scaleIn = Animated.sequence([
      Animated.spring(stampScale, {
        toValue: 1.3,
        damping: 4,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.spring(stampScale, {
        toValue: 1,
        damping: 8,
        useNativeDriver: true,
      }),
    ]);
    const rotateIn = Animated.sequence([
      Animated.timing(stampRotation, {
        toValue: -20,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(stampRotation, {
        toValue: -8,
        damping: 6,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      reveal,
      Animated.parallel([scaleIn, rotateIn]),
    ]).start();

    const timer = setTimeout(() => {
      triggerShake();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);

    return () => {
      clearTimeout(timer);
      stampScale.stopAnimation();
      stampRotation.stopAnimation();
    };
  }, [stampRotation, stampScale, triggerShake]);

  const stampStyle = {
    transform: [
      { scale: stampScale },
      {
        rotate: stampRotation.interpolate({
          inputRange: [-20, 0],
          outputRange: ['-20deg', '0deg'],
        }),
      },
    ],
  };

  const containerShakeStyle = {
    transform: [{ translateX: shakeX }],
  };

  const winnerColor = tierColors[winnerTier] ?? colors.primary;
  const mogText = scoreDiff >= 2 ? 'GIGAMOGGED' : scoreDiff >= 1 ? 'MOGGED' : 'EDGED OUT';

  return (
    <Animated.View style={[styles.container, containerShakeStyle]}>
      <Animated.View style={styles.winnerCard}>
        <Text style={styles.crownEmoji}>{'👑'}</Text>
        <Text style={[styles.winnerName, { color: winnerColor }]}>{winnerName}</Text>
        <Text style={[styles.winnerScore, { color: winnerColor }]}>{winnerScore.toFixed(1)}</Text>
        <Text style={[styles.winnerTier, { color: winnerColor }]}>{winnerTier}</Text>
      </Animated.View>

      <Animated.View style={[styles.stampContainer, stampStyle]}>
        <View style={[styles.stamp, { borderColor: winnerColor }]}>
          <Text style={[styles.stampText, { color: winnerColor }]}>{mogText}</Text>
        </View>
      </Animated.View>

      <Animated.View style={styles.loserCard}>
        <Text style={styles.loserName}>{loserName}</Text>
        <Text style={styles.loserScore}>{loserScore.toFixed(1)}</Text>
        <Text style={styles.loserTier}>{loserTier}</Text>
      </Animated.View>

      <Animated.View>
        <Text style={styles.diffText}>
          {scoreDiff.toFixed(1)} point{scoreDiff >= 2 ? '' : ''} difference
        </Text>
      </Animated.View>
    </Animated.View>
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
