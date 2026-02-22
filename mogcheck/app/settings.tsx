import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../lib/constants/theme';
import { useUserStore } from '../lib/store/useUserStore';
import { signOut } from '../lib/api/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { totalScans, highestScore, currentTier, isAuthenticated, username, reset } = useUserStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await signOut();
          reset();
          setLoggingOut(false);
          router.replace('/');
        },
      },
    ]);
  };

  const settingsItems = [
    {
      icon: 'heart-pulse' as const,
      title: 'Body Image Concerns?',
      subtitle: 'Access mental health resources',
      onPress: () => {
        Linking.openURL('https://988lifeline.org');
      },
    },
    {
      icon: 'phone' as const,
      title: '988 Suicide & Crisis Lifeline',
      subtitle: 'Call or text 988',
      onPress: () => Linking.openURL('tel:988'),
    },
    {
      icon: 'message-text' as const,
      title: 'Crisis Text Line',
      subtitle: 'Text HOME to 741741',
      onPress: () => Linking.openURL('sms:741741'),
    },
    {
      icon: 'file-document' as const,
      title: 'Terms of Service',
      subtitle: 'Read our terms',
      onPress: () => Linking.openURL('https://mogcheck.app/terms'),
    },
    {
      icon: 'shield-lock' as const,
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      onPress: () => Linking.openURL('https://mogcheck.app/privacy'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{highestScore > 0 ? highestScore.toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentTier ?? '—'}</Text>
              <Text style={styles.statLabel}>Current Tier</Text>
            </View>
          </View>
        </View>

        {/* Settings Items */}
        <Text style={styles.sectionTitle}>Support & Resources</Text>
        {settingsItems.map((item, index) => (
          <Pressable key={index} style={styles.settingItem} onPress={item.onPress}>
            <MaterialCommunityIcons name={item.icon} size={22} color={colors.textSecondary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ))}

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        {isAuthenticated ? (
          <>
            {username && (
              <View style={styles.settingItem}>
                <MaterialCommunityIcons name="account" size={22} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{username}</Text>
                  <Text style={styles.settingSubtitle}>Signed in</Text>
                </View>
              </View>
            )}
            <Pressable style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
              <Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Log Out'}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.settingItem} onPress={() => router.push('/auth')}>
            <MaterialCommunityIcons name="login" size={22} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.primary }]}>Sign In</Text>
              <Text style={styles.settingSubtitle}>Sign in to unlock premium features</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>MOGCHECK</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDisclaimer}>
            Entertainment purposes only. Scores are based on mathematical ratios and do not represent actual attractiveness or human value.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: colors.text,
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  settingSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  appName: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: colors.primary,
    letterSpacing: 2,
  },
  appVersion: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  appDisclaimer: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
    lineHeight: 16,
  },
});
