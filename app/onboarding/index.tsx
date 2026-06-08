import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function OnboardingOne() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your body syncs to music.</Text>
      <Text style={styles.body}>
        Studies show that walking or running in sync with music at your exact
        pace reduces perceived effort by 10% and improves endurance by 15%.
        {'\n\n'}
        This is called entrainment. Your nervous system naturally locks onto
        a steady beat, and Cadence uses it.
      </Text>
      <Pressable style={styles.button} onPress={() => router.push('/onboarding/how-it-works')}>
        <Text style={styles.buttonText}>How it works →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 24 },
  body: { fontSize: 17, color: '#aaa', lineHeight: 26, marginBottom: 48 },
  button: { backgroundColor: '#1DB954', borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '600' },
});
