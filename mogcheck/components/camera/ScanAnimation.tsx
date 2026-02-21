import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from '../../lib/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Animated scan line that sweeps up and down during analysis.
 * Creates the "scanning" visual effect.
 */
export function ScanAnimation({ visible }: { visible: boolean }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withRepeat(
        withTiming(300, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, translateY, opacity]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.scanLine, lineStyle]} pointerEvents="none">
      <Animated.View style={styles.lineGlow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scanLine: {
    position: 'absolute',
    top: '20%',
    left: SCREEN_WIDTH * 0.2,
    right: SCREEN_WIDTH * 0.2,
    height: 2,
    zIndex: 10,
  },
  lineGlow: {
    flex: 1,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});
