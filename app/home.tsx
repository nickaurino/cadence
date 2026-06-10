import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { SettingsButton } from '@/components/SettingsButton';
import { PressableScale } from '@/components/PressableScale';
import { SpotlightOverlay } from '@/components/SpotlightOverlay';
import { useTourSpotlight } from '@/tour/useTourSpotlight';

export default function Home() {
  const startRef = useRef<View>(null);
  const { tour, step, targetRect } = useTourSpotlight('home', { start: startRef });

  // The guided tour starts here whenever it's pending (first launch after
  // onboarding, or Replay tour).
  useEffect(() => {
    if (tour.ready && tour.pending && !tour.running) tour.begin();
  }, [tour.ready, tour.pending, tour.running]);

  function handleStart() {
    // During the tour the Start tap IS the advance action.
    if (step?.id === 'home-start') tour.advance();
    router.push('/session/setup');
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <SettingsButton />

      <View style={styles.spacer} />

      <Text style={styles.title}>Cadence</Text>
      <Text style={styles.subtitle}>Music that moves with you.</Text>

      <View ref={startRef} collapsable={false}>
        <PressableScale style={styles.start} onPress={handleStart}>
          <View style={styles.startDisc}>
            <SymbolView name="play.fill" size={48} type="monochrome" tintColor={colors.accent} />
          </View>
        </PressableScale>
      </View>

      <View style={styles.spacer} />

      {step && targetRect && (
        <SpotlightOverlay
          targetRect={targetRect}
          copy={step.copy}
          onSkip={tour.skip}
          passthrough
        />
      )}
    </SafeAreaView>
  );
}

const RING_SIZE = 184;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 28 },
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
