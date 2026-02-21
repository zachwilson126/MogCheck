import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/constants/theme';
import { GlowButton } from '../components/shared/GlowButton';
import { signUp, signIn } from '../lib/api/auth';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password, username || undefined);
        if (result.error) {
          setError(result.error);
        } else {
          router.replace('/');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.replace('/');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Text style={styles.logo}>MOGCHECK</Text>
        <Text style={styles.subtitle}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </Text>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <GlowButton
          title={loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          onPress={handleSubmit}
          size="large"
          disabled={loading || !email || !password}
          style={{ marginTop: 8, width: '100%' }}
        />

        <Pressable onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
          <Text style={styles.switchText}>
            {mode === 'signup'
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  switchText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.primary,
    marginTop: 16,
  },
  skipText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
});
