// app/onboarding/connect.tsx — Apple Music permission primer.

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authorize } from '@/music/auth';
import { colors } from '@/theme/colors';
import { PRIMERS } from '@/onboarding/copy';

export default function ConnectAppleMusic() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  // Onboarding flows straight into the first session (momentum to the aha);
  // re-auth from the app root just returns home. markOnboardingComplete fires at
  // session start, not here.
  //
  // The primer is ALWAYS shown (no auto-skip on isAuthorized): MusicKit's
  // authorization status lags the Settings toggle, so auto-skipping wrongly hid
  // this screen. Already-authorized users just tap Connect and authorize()
  // resolves instantly; not-authorized users get the real prompt.
  function proceed() {
    if (from === 'onboarding') router.replace('/session/setup');
    else router.replace('/home');
  }

  async function handleConnect() {
    setLoading(true);
    setDenied(false);
    try {
      await authorize();
      proceed();
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PRIMERS.appleMusic.title}</Text>
      <Text style={styles.body}>{PRIMERS.appleMusic.body}</Text>
      <Text style={styles.disclaimer}>{PRIMERS.appleMusic.disclaimer}</Text>

      {denied && (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedText}>
            You can still use cadence detection. Playback control requires Apple Music access.
          </Text>
          <Pressable onPress={proceed}>
            <Text style={styles.skipText}>{PRIMERS.appleMusic.continueWithout}</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.button} onPress={handleConnect} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.onAccent} />
          : <Text style={styles.buttonText}>{PRIMERS.appleMusic.cta}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  body: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 12 },
  disclaimer: { fontSize: 14, color: colors.faint, lineHeight: 20, marginBottom: 48 },
  deniedBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 },
  deniedText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  skipText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  button: { backgroundColor: colors.text, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
