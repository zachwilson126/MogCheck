import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../../lib/constants/theme';
import { useUserStore } from '../../lib/store/useUserStore';

interface CoinBalanceProps {
  size?: 'small' | 'medium';
}

export function CoinBalance({ size = 'medium' }: CoinBalanceProps) {
  const coins = useUserStore((s) => s.coins);

  const iconSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 14 : 18;

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <MaterialCommunityIcons name="circle-multiple" size={iconSize} color="#FFD700" />
      <Text style={[styles.text, { fontSize }]}>{coins}</Text>
    </View>
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
  text: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFD700',
  },
});
