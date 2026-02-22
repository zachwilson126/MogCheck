import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../lib/constants/theme';
import { tierColors } from '../../lib/constants/theme';
import { useScreenShake } from '../../lib/hooks/useScreenShake';

interface ScoreRevealProps {
  score: number;
  tierName: string;
  tierColor: string;
  onRevealComplete?: () => void;
}

export function ScoreReveal({ score, tierName, tierColor, onRevealComplete }: ScoreRevealProps) {
  const displayScore = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.5);
  const tierOpacity = useSharedValue(0);
  const tierScale = useSharedValue(0.3);
  const tierTranslateY = useSharedValue(-30);
  const { shakeX, triggerShake } = useScreenShake();

  useEffect(() => {
    // Animate score counting up
    scoreOpacity.value = withTiming(1, { duration: 300 });
    scoreScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    displayScore.value = withTiming(score, {
      duration: 2000,
      easing: Easing.out(Easing.cubic),
    });

    // After score reveal, show tier badge
    tierOpacity.value = withDelay(2200, withTiming(1, { duration: 400 }));
    tierScale.value = withDelay(2200,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 }),
      ),
    );
    tierTranslateY.value = withDelay(2200, withSpring(0, { damping: 12, stiffness: 100 }));

    // Haptic + screen shake on tier reveal
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerShake();
      onRevealComplete?.();
    }, 2600);

    return () => clearTimeout(timer);
  }, [score]);

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ scale: scoreScale.value }],
  }));

  const scoreTextStyle = useAnimatedStyle(() => ({
    // We can't directly interpolate text, so we'll use a workaround
    opacity: 1,
  }));

  const tierStyle = useAnimatedStyle(() => ({
    opacity: tierOpacity.value,
    transform: [
      { scale: tierScale.value },
      { translateY: tierTranslateY.value },
    ],
  }));

  const containerShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerShakeStyle]}>
      <Animated.View style={[styles.scoreContainer, scoreStyle]}>
        <AnimatedScore score={score} tierColor={tierColor} />
      </Animated.View>
      <Animated.View style={[styles.tierContainer, tierStyle]}>
        <View style={[styles.tierBadge, { borderColor: tierColor }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>{tierName}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Animated counting score display.
 */
function AnimatedScore({ score, tierColor }: { score: number; tierColor: string }) {
  const [displayValue, setDisplayValue] = useState('0.0');
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(score, {
      duration: 2000,
      easing: Easing.out(Easing.cubic),
    });

    // Manual counter for display
    const start = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const current = eased * score;
      setDisplayValue(current.toFixed(1));

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(score.toFixed(1));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [score]);

  return (
    <Text style={[styles.scoreText, { color: tierColor }]}>{displayValue}</Text>
  );
}

import { useState } from 'react';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 96,
    letterSpacing: 2,
  },
  tierContainer: {
    marginTop: 8,
  },
  tierBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tierText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    letterSpacing: 4,
  },
});
