import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';

export default function Home() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.settings} hitSlop={14} onPress={() => router.push('/settings')}>
        <SymbolView name="gearshape.fill" size={26} type="monochrome" tintColor={colors.faint} />
      </Pressable>

      <Text style={styles.title}>Cadence</Text>
      <Text style={styles.subtitle}>Music that moves with you.</Text>
      <Pressable style={styles.button} onPress={() => router.push('/session/setup')}>
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  settings: { position: 'absolute', top: 64, right: 28, padding: 8 },
  title: { fontSize: 48, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 18, color: colors.muted, marginBottom: 64 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: colors.onAccent, fontSize: 28, fontWeight: '700' },
});
