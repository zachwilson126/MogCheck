import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { paperTheme, colors } from '../lib/constants/theme';
import { onAuthStateChange } from '../lib/api/auth';
import { useUserStore } from '../lib/store/useUserStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const setAuth = useUserStore((s) => s.setAuth);
  const syncWithServer = useUserStore((s) => s.syncWithServer);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Request App Tracking Transparency permission (iOS 14+)
  // Must happen before ads initialize to get personalized ads
  useEffect(() => {
    if (Platform.OS === 'ios') {
      requestTrackingPermissionsAsync();
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange((session) => {
      setAuth(session?.user ?? null, session);
      if (session?.user) {
        syncWithServer();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, syncWithServer]);

  // Handle deep links for battle invites (mogcheck://battle/CODE)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      const battleMatch = url.match(/battle\/([A-Za-z0-9]+)/);
      if (battleMatch) {
        // Deep link to battle — for now navigate to scan with battle context
        // In full implementation, this would load the battle from server
        router.push('/scan');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="results/[id]" />
          <Stack.Screen name="battle/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="history" />
          <Stack.Screen name="glowup/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="store" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
