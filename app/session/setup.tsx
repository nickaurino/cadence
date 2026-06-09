import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <Pressable style={styles.settings} hitSlop={14} onPress={() => router.push('/settings')}>
        <SymbolView name="gearshape.fill" size={24} type="monochrome" tintColor={colors.faint} />
      </Pressable>

      <Text style={styles.heading}>What&apos;s the vibe?</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 32, justifyContent: 'center' },
  settings: { position: 'absolute', top: 64, right: 28, padding: 8 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vibeBtn: { borderRadius: 50, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 20 },
  vibeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  vibeBtnText: { color: colors.muted, fontSize: 16 },
  vibeBtnTextActive: { color: colors.accent },
  startBtn: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 18, alignItems: 'center', marginTop: 48 },
  startBtnText: { color: colors.onAccent, fontSize: 18, fontWeight: '700' },
});
