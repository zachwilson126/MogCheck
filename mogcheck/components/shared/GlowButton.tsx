import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
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
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const sizeStyles = {
    large: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16 },
    medium: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
    small: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  };

  const fontSizes = { large: 20, medium: 16, small: 14 };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        sizeStyles[size],
        isPrimary && { backgroundColor: color },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color },
        !isPrimary && !isOutline && { backgroundColor: 'rgba(57, 255, 20, 0.15)' },
        pulsing && !disabled && styles.pulsing,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: fontSizes[size] },
          isPrimary && { color: colors.background },
          isOutline && { color },
          !isPrimary && !isOutline && { color: colors.primary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pulsing: {
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
