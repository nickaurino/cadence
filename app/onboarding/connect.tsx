// app/onboarding/connect.tsx

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authorize } from '@/music/auth';
import { markOnboardingComplete } from '@/storage/store';
import { colors } from '@/theme/colors';

export default function ConnectAppleMusic() {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  async function handleConnect() {
    setLoading(true);
    setDenied(false);
    try {
      await authorize();
      await markOnboardingComplete();
      router.replace('/home');
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinueWithout() {
    await markOnboardingComplete();
    router.replace('/home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Apple Music</Text>
      <Text style={styles.body}>
        Cadence needs access to Apple Music to play songs matched to your pace.
      </Text>

      {denied && (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedText}>
            You can still use cadence detection. Playback control requires Apple Music access.
          </Text>
          <Pressable onPress={handleContinueWithout}>
            <Text style={styles.skipText}>Continue without Apple Music</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.button} onPress={handleConnect} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.onAccent} />
          : <Text style={styles.buttonText}>Connect Apple Music</Text>}
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
  skipText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  button: { backgroundColor: colors.text, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
