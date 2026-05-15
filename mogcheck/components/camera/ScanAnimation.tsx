import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Easing, View } from 'react-native';
import { colors } from '../../lib/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Animated scan line that sweeps up and down during analysis.
 * Creates the "scanning" visual effect.
 */
export function ScanAnimation({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();

    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const sweep = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: 300,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loopRef.current = sweep;
      sweep.start();
    } else {
      translateY.setValue(0);
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [visible, translateY, opacity]);

  const lineStyle = {
    transform: [{ translateY }],
    opacity,
  };

  return (
    <Animated.View style={[styles.scanLine, lineStyle]} pointerEvents="none">
      <View style={styles.lineGlow} />
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
