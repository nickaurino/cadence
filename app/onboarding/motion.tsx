import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { colors } from '@/theme/colors';
import { PRIMERS } from '@/onboarding/copy';

// Why-first motion primer, shown before the native motion prompt. Never traps the
// user: if access is already granted it skips straight through, and "Not now"
// always lets them continue (the in-app no-motion state handles a missing
// permission later). It urges, but does not block.
export default function MotionPrimer() {
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  function proceed() {
    router.replace({ pathname: '/onboarding/connect', params: { from: 'onboarding' } });
  }

  // Already granted (e.g. after Reset app, where the OS permission persists) ->
  // don't make them tap an Allow button iOS can no longer act on. Skip through.
  useEffect(() => {
    Pedometer.getPermissionsAsync()
      .then((p) => (p.granted ? proceed() : setChecking(false)))
      .catch(() => setChecking(false));
  }, []);

  async function handleAllow() {
    try {
      const res = await Pedometer.requestPermissionsAsync();
      if (res.granted) proceed();
      else setDenied(true);
    } catch {
      setDenied(true);
    }
  }

  if (checking) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PRIMERS.motion.title}</Text>
      <Text style={styles.body}>{PRIMERS.motion.body}</Text>

      {denied && (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedText}>{PRIMERS.motion.deniedNote}</Text>
          <Pressable onPress={() => Linking.openSettings().catch(() => {})}>
            <Text style={styles.link}>Open Settings</Text>
          </Pressable>
        </View>
      )}

      {denied ? (
        <Pressable style={styles.button} onPress={proceed}>
          <Text style={styles.buttonText}>Continue anyway</Text>
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.button} onPress={handleAllow}>
            <Text style={styles.buttonText}>{PRIMERS.motion.cta}</Text>
          </Pressable>
          <Pressable style={styles.skip} onPress={proceed}>
            <Text style={styles.skipText}>{PRIMERS.motion.skip}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  body: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 48 },
  deniedBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 },
  deniedText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  button: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
  skip: { paddingVertical: 16, alignItems: 'center' },
  skipText: { color: colors.faint, fontSize: 15, fontWeight: '600' },
});
