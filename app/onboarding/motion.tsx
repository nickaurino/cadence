import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { colors } from '@/theme/colors';
import { PRIMERS } from '@/onboarding/copy';

// Why-first motion primer, shown before the native motion prompt. Granted or
// denied, the user can proceed: the in-session no-motion state offers a manual
// pace, so denial is never a dead end.
export default function MotionPrimer() {
  const [denied, setDenied] = useState(false);

  function proceed() {
    router.push('/onboarding/connect?from=onboarding');
  }

  async function handleAllow() {
    try {
      const res = await Pedometer.requestPermissionsAsync();
      if (res.granted) proceed();
      else setDenied(true);
    } catch {
      setDenied(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PRIMERS.motion.title}</Text>
      <Text style={styles.body}>{PRIMERS.motion.body}</Text>

      {denied && (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedText}>{PRIMERS.motion.deniedNote}</Text>
          <View style={styles.deniedActions}>
            <Pressable onPress={() => Linking.openSettings().catch(() => {})}>
              <Text style={styles.link}>Open Settings</Text>
            </Pressable>
            <Pressable onPress={proceed}>
              <Text style={styles.link}>Set my pace manually</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.button} onPress={handleAllow}>
        <Text style={styles.buttonText}>{PRIMERS.motion.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  body: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 48 },
  deniedBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 },
  deniedText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  deniedActions: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  button: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
