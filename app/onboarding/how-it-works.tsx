import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';

export default function OnboardingTwo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Three steps.</Text>
      {[
        ['1', 'Connect Apple Music', 'We use your library to find the right songs.'],
        ['2', 'Pick a vibe and go', 'Start moving and we detect your pace automatically.'],
        ['3', 'Music locks to your stride', 'Songs queue at your exact BPM. Run faster, music speeds up.'],
      ].map(([num, heading, sub]) => (
        <View key={num} style={styles.step}>
          <Text style={styles.stepNum}>{num}</Text>
          <View>
            <Text style={styles.stepHeading}>{heading}</Text>
            <Text style={styles.stepSub}>{sub}</Text>
          </View>
        </View>
      ))}
      <Pressable style={styles.button} onPress={() => router.push('/onboarding/connect')}>
        <Text style={styles.buttonText}>Connect Apple Music →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 32 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 28, gap: 16 },
  stepNum: { fontSize: 24, fontWeight: '700', color: colors.accent, width: 32 },
  stepHeading: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 },
  stepSub: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  button: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
