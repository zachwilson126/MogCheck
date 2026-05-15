import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const colors = {
  background: '#0A0A0A',
  surface: '#141414',
  border: '#2A2A2A',
  primary: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
} as const;

const ACTIONS = [
  { label: 'Start Scan', route: '/scan' as const },
  { label: 'History', route: '/history' as const },
  { label: 'Settings', route: '/settings' as const },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.kicker}>MogCheck</Text>
        <Text style={styles.title}>Ready for your next scan</Text>
        <Text style={styles.subtitle}>
          Take a straight-on photo, get your score, and keep your best results
          in one place.
        </Text>

        <View style={styles.actions}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.route}
              onPress={() => router.push(action.route)}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 72,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  kicker: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  button: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
