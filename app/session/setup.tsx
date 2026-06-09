import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Vibe } from '@/types';
import { colors } from '@/theme/colors';

const VIBES: { id: Vibe; label: string }[] = [
  { id: 'hype', label: 'Hype' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'rock', label: 'Rock' },
  { id: 'pop', label: 'Pop' },
  { id: 'mix', label: 'Mix' },
];

export default function SessionSetup() {
  const [vibe, setVibe] = useState<Vibe>('mix');

  function handleStart() {
    router.push({ pathname: '/session/active', params: { vibe } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable style={styles.settings} hitSlop={14} onPress={() => router.push('/settings')}>
        <SymbolView name="gearshape.fill" size={24} type="monochrome" tintColor={colors.faint} />
      </Pressable>

      <View style={styles.spacer} />

      <View style={styles.content}>
        <Text style={styles.heading}>What&apos;s the vibe?</Text>
        <Text style={styles.subtext}>
          Pick a sound. We&apos;ll match the tempo to your stride.
        </Text>

        <View style={styles.vibeGrid}>
          {VIBES.map((v) => (
            <Pressable
              key={v.id}
              style={[styles.vibeBtn, vibe === v.id && styles.vibeBtnActive]}
              onPress={() => setVibe(v.id)}
            >
              <Text style={[styles.vibeBtnText, vibe === v.id && styles.vibeBtnTextActive]}>
                {v.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>Let&apos;s go</Text>
        </Pressable>
      </View>

      <View style={styles.spacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 32 },
  settings: { position: 'absolute', top: 64, right: 28, padding: 8, zIndex: 1 },
  spacer: { flex: 1 },
  content: { alignItems: 'center' },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtext: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  vibeBtn: { borderRadius: 50, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 22 },
  vibeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  vibeBtnText: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  vibeBtnTextActive: { color: colors.accent },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 44,
    shadowColor: colors.accent,
    shadowRadius: 16,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
  startBtnText: { color: colors.onAccent, fontSize: 18, fontWeight: '700' },
});
