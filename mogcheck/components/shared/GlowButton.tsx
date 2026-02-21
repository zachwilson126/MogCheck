import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fonts } from '../../lib/constants/theme';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  pulsing?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlowButton({
  title,
  onPress,
  color = colors.primary,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  pulsing = false,
  style,
}: GlowButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (pulsing && !disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [pulsing, disabled, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const sizeStyles = {
    large: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16 },
    medium: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
    small: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  };

  const fontSizes = { large: 20, medium: 16, small: 14 };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      style={[
        animatedStyle,
        styles.container,
        sizeStyles[size],
        isPrimary && { backgroundColor: color },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color },
        !isPrimary && !isOutline && { backgroundColor: colors.surfaceVariant },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {pulsing && !disabled && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: color, borderRadius: sizeStyles[size].borderRadius },
            glowStyle,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { fontSize: fontSizes[size] },
          isPrimary && { color: colors.background },
          isOutline && { color },
          !isPrimary && !isOutline && { color: colors.text },
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
