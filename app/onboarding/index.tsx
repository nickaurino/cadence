import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { FRAMING } from '@/onboarding/copy';

export default function OnboardingOne() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{FRAMING.payoff.title}</Text>
      <Text style={styles.body}>{FRAMING.payoff.body}</Text>
      <Pressable style={styles.button} onPress={() => router.push('/onboarding/how-it-works')}>
        <Text style={styles.buttonText}>{FRAMING.payoff.cta} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  body: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 48 },
  button: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
