import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Vibe } from '@/types';
import { colors } from '@/theme/colors';
import { SettingsButton } from '@/components/SettingsButton';
import { PressableScale } from '@/components/PressableScale';
import { SpotlightOverlay } from '@/components/SpotlightOverlay';
import { useTourSpotlight } from '@/tour/useTourSpotlight';

const VIBES: { id: Vibe; label: string }[] = [
  { id: 'hype', label: 'Hype' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'rock', label: 'Rock' },
  { id: 'pop', label: 'Pop' },
  { id: 'mix', label: 'Mix' },
];

export default function SessionSetup() {
  const [vibe, setVibe] = useState<Vibe>('mix');

  const vibesRef = useRef<View>(null);
  const goRef = useRef<View>(null);
  const { tour, step, targetRect } = useTourSpotlight('setup', { vibes: vibesRef, go: goRef });

  function handleStart() {
    // During the tour, "Let's go" advances the script and opens a SIMULATED
    // session (canned state, no engine or music) so the walkthrough works
    // anywhere, no walking required.
    if (step?.id === 'setup-go') {
      tour.advance();
      router.push({ pathname: '/session/active', params: { vibe, demo: '1' } });
    } else {
      router.push({ pathname: '/session/active', params: { vibe } });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <SettingsButton />

      <View style={styles.spacer} />

      <View style={styles.content}>
        <Text style={styles.heading}>What&apos;s the vibe?</Text>
        <Text style={styles.subtext}>
          Pick a sound. We&apos;ll match the tempo to your stride.
        </Text>

        <View ref={vibesRef} collapsable={false} style={styles.vibeGrid}>
          {VIBES.map((v) => (
            <PressableScale
              key={v.id}
              style={[styles.vibeBtn, vibe === v.id && styles.vibeBtnActive]}
              onPress={() => setVibe(v.id)}
            >
              <Text style={[styles.vibeBtnText, vibe === v.id && styles.vibeBtnTextActive]}>
                {v.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        <View ref={goRef} collapsable={false} style={styles.goWrap}>
          <PressableScale style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Let&apos;s go</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.spacer} />

      {step && targetRect && (
        <SpotlightOverlay
          targetRect={targetRect}
          copy={step.copy}
          onDismiss={step.advance === 'tap' ? tour.advance : undefined}
          onSkip={tour.skip}
          cardPosition={step.cardPosition}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 32 },
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
  vibeBtnText: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  vibeBtnTextActive: { color: colors.accent },
  vibeBtn: { borderRadius: 50, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 22 },
  vibeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  // The 44px gap lives on the wrapper, NOT the button: the tour measures the
  // wrapper for the spotlight, and a margin inside it doubled the highlight height.
  goWrap: { alignSelf: 'stretch', marginTop: 44 },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: colors.accent,
    shadowRadius: 16,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
  startBtnText: { color: colors.onAccent, fontSize: 18, fontWeight: '700' },
});
