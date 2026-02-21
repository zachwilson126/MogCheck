import { View, Text, StyleSheet } from 'react-native';
import { Tier } from '../../lib/constants/tiers';
import { colors } from '../../lib/constants/theme';

interface TierBadgeProps {
  tier: Tier;
  size?: 'small' | 'medium' | 'large';
}

export function TierBadge({ tier, size = 'medium' }: TierBadgeProps) {
  const sizeStyles = {
    small: { fontSize: 14, paddingH: 12, paddingV: 4, borderRadius: 8 },
    medium: { fontSize: 20, paddingH: 16, paddingV: 6, borderRadius: 10 },
    large: { fontSize: 32, paddingH: 24, paddingV: 8, borderRadius: 12 },
  };

  const s = sizeStyles[size];

  return (
    <View style={[styles.badge, {
      borderColor: tier.color,
      paddingHorizontal: s.paddingH,
      paddingVertical: s.paddingV,
      borderRadius: s.borderRadius,
    }]}>
      <Text style={[styles.text, { fontSize: s.fontSize, color: tier.color }]}>
        {tier.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'center',
  },
  text: {
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
