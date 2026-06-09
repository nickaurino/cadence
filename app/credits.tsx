import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { colors } from '@/theme/colors';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

// Light "made by people" credits. Names + roles + a thank-you + version.
const PEOPLE: { name: string; role: string }[] = [
  { name: 'Nick Aurino', role: 'Design & development' },
  { name: 'Zernell', role: 'Collaboration' },
];

export default function Credits() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credits</Text>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {PEOPLE.map((p) => (
          <View key={p.name} style={styles.person}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.role}>{p.role}</Text>
          </View>
        ))}

        <Text style={styles.thanks}>
          Made by people who love running to the right song. Thank you for trying it.
        </Text>
      </View>

      <Text style={styles.version}>Cadence v{VERSION}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '800' },
  done: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  person: { marginBottom: 24 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  role: { color: colors.accent, fontSize: 15, marginTop: 4 },
  thanks: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 16 },
  version: { color: colors.faint, fontSize: 13, textAlign: 'center', paddingBottom: 24 },
});
