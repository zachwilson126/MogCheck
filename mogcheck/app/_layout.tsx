import { Stack } from 'expo-router';

const BACKGROUND = '#0A0A0A';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND },
        animation: 'none',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="results/[id]" />
      <Stack.Screen name="battle/[id]" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="history" />
      <Stack.Screen name="glowup/[id]" />
      <Stack.Screen name="store" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
