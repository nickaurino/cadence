import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';

export default function Home() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable style={styles.settings} hitSlop={14} onPress={() => router.push('/settings')}>
        <SymbolView name="gearshape.fill" size={26} type="monochrome" tintColor={colors.faint} />
      </Pressable>

      <View style={styles.spacer} />

      <Text style={styles.title}>Cadence</Text>
      <Text style={styles.subtitle}>Music that moves with you.</Text>

      <Pressable style={styles.start} onPress={() => router.push('/session/setup')}>
        <View style={styles.startDisc}>
          <SymbolView name="play.fill" size={48} type="monochrome" tintColor={colors.accent} />
        </View>
      </Pressable>

      <View style={styles.spacer} />
    </SafeAreaView>
  );
}

const RING_SIZE = 184;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 28 },
  settings: { position: 'absolute', top: 12, right: 8, padding: 8, zIndex: 1 },
  spacer: { flex: 1 },
  title: { fontSize: 52, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 17, color: colors.muted, marginTop: 10, marginBottom: 56 },
  start: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 10,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowRadius: 22,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
  },
  startDisc: {
    flex: 1,
    alignSelf: 'stretch',
    margin: 6,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
