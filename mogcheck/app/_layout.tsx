import { useEffect } from 'react';
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
import { paperTheme, colors } from '../lib/constants/theme';
import { onAuthStateChange } from '../lib/api/auth';
import { supabase } from '../lib/api/supabase';
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
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      const normalizedUrl = url.includes('#') ? url.replace('#', '?') : url;
      const queryString = normalizedUrl.split('?')[1] ?? '';
      const params = new URLSearchParams(queryString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const authCode = params.get('code');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          router.replace('/');
          return;
        }

        if (__DEV__) console.warn('[MogCheck] Failed to set auth session from deep link:', error.message);
      } else if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (!error) {
          router.replace('/');
          return;
        }

        if (__DEV__) console.warn('[MogCheck] Failed to exchange auth code from deep link:', error.message);
      }

      const battleMatch = url.match(/battle\/([A-Za-z0-9-]+)/);
      if (battleMatch) {
        router.push(`/battle/${battleMatch[1]}`);
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
          <Stack.Screen name="scan" options={{ animation: 'fade' }} />
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
