import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { hasCompletedOnboarding } from '@/storage/store';
import { isAuthorized } from '@/music/auth';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const onboarded = await hasCompletedOnboarding();
      if (!onboarded) { setDestination('/onboarding'); return; }
      const authed = await isAuthorized();
      setDestination(authed ? '/home' : '/onboarding/connect');
    })();
  }, []);

  if (!destination) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1DB954" />
        <Text style={styles.loadingText}>Getting things ready</Text>
      </View>
    );
  }
  return <Redirect href={destination as Href} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#888', fontSize: 15 },
});
