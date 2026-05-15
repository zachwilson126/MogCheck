import { useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useRef } from 'react';

/**
 * Screen shake hook. Uses React Native's built-in Animated API so result
 * screens do not depend on Reanimated native modules.
 * Shake is ±5px oscillation decaying over ~300ms.
 */
export function useScreenShake() {
  const shakeX = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    shakeX.stopAnimation();
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 5, duration: 40, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 40, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 4, duration: 40, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -4, duration: 40, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 3, duration: 35, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -3, duration: 35, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 2, duration: 35, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -2, duration: 35, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 30, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  return { shakeX, triggerShake };
}
