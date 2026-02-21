import { MD3DarkTheme } from 'react-native-paper';

export const colors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceVariant: '#1E1E1E',
  card: '#1A1A1A',
  border: '#2A2A2A',
  primary: '#39FF14',
  primaryDim: '#2BCC10',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Tier colors
  chud: '#DC2626',
  npc: '#9CA3AF',
  mid: '#EAB308',
  chadlite: '#60A5FA',
  chad: '#F59E0B',
  gigachad: '#A855F7',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;

export const fonts = {
  display: 'BebasNeue_400Regular',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const paperTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    onSurface: colors.text,
    onBackground: colors.text,
    outline: colors.border,
  },
};

export const tierColors: Record<string, string> = {
  CHUD: colors.chud,
  NPC: colors.npc,
  MID: colors.mid,
  CHADLITE: colors.chadlite,
  CHAD: colors.chad,
  GIGACHAD: colors.gigachad,
};
