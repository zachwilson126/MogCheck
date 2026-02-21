import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { colors } from '../../lib/constants/theme';
import { useUserStore } from '../../lib/store/useUserStore';
import { GlowButton } from './GlowButton';

/**
 * Full-screen disclaimer modal shown on first launch.
 * User must accept before using the app.
 */
export function DisclaimerModal() {
  const disclaimerAccepted = useUserStore((s) => s.disclaimerAccepted);
  const acceptDisclaimer = useUserStore((s) => s.acceptDisclaimer);

  if (disclaimerAccepted) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Before You Start</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              MogCheck is an entertainment app that analyzes facial proportions using mathematical ratios.
            </Text>
            <Text style={styles.heading}>IMPORTANT:</Text>
            <Text style={styles.bullet}>{'\u2022'} This app is for ENTERTAINMENT PURPOSES ONLY</Text>
            <Text style={styles.bullet}>{'\u2022'} Scores and ratings are based on mathematical ratios and do not represent actual attractiveness or human value</Text>
            <Text style={styles.bullet}>{'\u2022'} We do NOT provide medical, surgical, cosmetic, or health advice</Text>
            <Text style={styles.bullet}>{'\u2022'} Never make medical or cosmetic decisions based on this app's output</Text>
            <Text style={styles.bullet}>{'\u2022'} AI-generated "improvement" suggestions are for entertainment only</Text>
            <Text style={styles.bullet}>{'\u2022'} AI-generated image transformations are fictional and do not represent achievable results</Text>
            <Text style={styles.bullet}>{'\u2022'} Beauty is subjective and cannot be reduced to mathematical formulas</Text>
            <Text style={styles.bullet}>{'\u2022'} If you are experiencing body image issues, please consult a mental health professional</Text>
            <Text style={[styles.body, { marginTop: 16 }]}>
              By using MogCheck, you acknowledge this is entertainment and agree to our Terms of Service.
            </Text>
          </ScrollView>
          <GlowButton
            title="I Understand & Agree"
            onPress={acceptDisclaimer}
            size="large"
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Inline disclaimer banner for results screens.
 */
export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 400,
  },
  heading: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bullet: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 8,
    marginBottom: 4,
  },
  banner: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  bannerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
