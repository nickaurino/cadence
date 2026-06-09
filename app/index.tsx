import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { hasCompletedOnboarding } from '@/storage/store';
import { isAuthorized } from '@/music/auth';
import { loadPersisted, shouldResume, clearPersisted } from '@/storage/session-store';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const onboarded = await hasCompletedOnboarding();
      if (!onboarded) { setDestination('/onboarding'); return; }
      const authed = await isAuthorized();
      if (!authed) { setDestination('/onboarding/connect'); return; }
      const snap = await loadPersisted();
      if (snap && shouldResume(snap, Date.now())) {
        setDestination(`/session/active?vibe=${snap.vibe}&resume=1`);
        return;
      }
      if (snap) await clearPersisted(); // stale -> discard
      setDestination('/home');
    })();
  }, []);

  if (!destination) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Getting things ready</Text>
      </View>
    );
  }
  return <Redirect href={destination as Href} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: colors.muted, fontSize: 15 },
});
