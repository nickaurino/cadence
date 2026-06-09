import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { colors } from '@/theme/colors';
import { PRIMERS } from '@/onboarding/copy';

// Motion primer. Core Motion (CMPedometer) has NO explicit authorization API —
// requestPermissionsAsync does not surface the iOS dialog. The Motion & Fitness
// prompt fires only on an actual data query, so we issue a real getStepCountAsync
// here to trigger it now (rather than later at session start). We proceed
// regardless of the result: if already decided, iOS won't re-prompt
// (canAskAgain:false) and the in-app no-motion state handles a denial later.
export default function MotionPrimer() {
  const [asking, setAsking] = useState(false);

  async function handleAllow() {
    setAsking(true);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 1000);
      await Pedometer.getStepCountAsync(start, end); // triggers the OS prompt
    } catch {
      // denied or no data — proceed; the in-app no-motion state handles denial.
    } finally {
      router.push('/onboarding/connect?from=onboarding');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PRIMERS.motion.title}</Text>
      <Text style={styles.body}>{PRIMERS.motion.body}</Text>
      <Pressable style={styles.button} onPress={handleAllow} disabled={asking}>
        {asking ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.buttonText}>{PRIMERS.motion.cta}</Text>
        )}
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
