import { useCallback } from 'react';
import {
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Screen shake hook — returns a shared value for translateX and a trigger function.
 * Shake is ±5px oscillation decaying over ~300ms.
 */
export function useScreenShake() {
  const shakeX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(5, { duration: 40, easing: Easing.linear }),
      withTiming(-5, { duration: 40, easing: Easing.linear }),
      withTiming(4, { duration: 40, easing: Easing.linear }),
      withTiming(-4, { duration: 40, easing: Easing.linear }),
      withTiming(3, { duration: 35, easing: Easing.linear }),
      withTiming(-3, { duration: 35, easing: Easing.linear }),
      withTiming(2, { duration: 35, easing: Easing.linear }),
      withTiming(-2, { duration: 35, easing: Easing.linear }),
      withTiming(0, { duration: 30, easing: Easing.linear }),
    );
  }, [shakeX]);

  return { shakeX, triggerShake };
}
