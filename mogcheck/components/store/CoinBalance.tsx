import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../../lib/constants/theme';
import { useUserStore } from '../../lib/store/useUserStore';

interface CoinBalanceProps {
  size?: 'small' | 'medium';
}

export function CoinBalance({ size = 'medium' }: CoinBalanceProps) {
  const coins = useUserStore((s) => s.coins);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  const iconSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 14 : 18;

  return (
    <Animated.View style={[styles.container, size === 'small' && styles.containerSmall, styles.goldGlow, animatedStyle]}>
      <MaterialCommunityIcons name="circle-multiple" size={iconSize} color="#FFD700" />
      <Text style={[styles.text, { fontSize }]}>{coins}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  goldGlow: {
    shadowColor: '#FFD700',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFD700',
  },
});
