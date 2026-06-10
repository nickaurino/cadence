import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, AppState, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionEngine } from '@/engine/session';
import { sessionStatusLabel } from '@/engine/status';
import { isAvailable } from '@/music/auth';
import { loadPersisted, shouldResume, clearPersisted } from '@/storage/session-store';
import { FIRST_RUN_REASSURANCE } from '@/onboarding/copy';
import { ManualPaceModal } from '@/components/ManualPaceModal';
import { CadenceRing } from '@/components/CadenceRing';
import { HoldToEnd } from '@/components/HoldToEnd';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/ProgressBar';
import { NoMotionState } from '@/components/NoMotionState';
import { SpotlightOverlay } from '@/components/SpotlightOverlay';
import { getPlaybackStatus } from '@/music/player';
import { canReadMotion } from '@/sensors/cadence';
import { useTourSpotlight } from '@/tour/useTourSpotlight';
import { SessionState, Vibe } from '@/types';
import { colors } from '@/theme/colors';

// Canned session state for the tour's "just show me around" mode: no engine, no
// pedometer, no music. Clearly sample data, never presented as a real reading.
const DEMO_STATE: SessionState = {
  vibe: 'mix',
  perceivedCadence: 142,
  managedCadence: 142,
  isCalibrating: false,
  isLoadingTracks: false,
  paceLocked: false,
  inThePocket: true,
  pocketCloseness: 1,
  isPlaying: true,
  notice: null,
  currentTrack: {
    id: 'demo',
    name: 'Sample song',
    artist: 'Matched to your pace',
    albumArtUrl: '',
    tempo: 142,
  },
  queue: [],
  startedAt: 0,
};

export default function ActiveSession() {
  const { vibe, resume, demo } = useLocalSearchParams<{ vibe: Vibe; resume?: string; demo?: string }>();
  const isDemo = demo === '1';
  const engineRef = useRef(new SessionEngine());
  const [state, setState] = useState<SessionState | null>(isDemo ? DEMO_STATE : null);
  const [error, setError] = useState<string | null>(null);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [paceModal, setPaceModal] = useState(false);
  // null = not yet checked; false = motion unavailable (no-motion state)
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  // Once the user picks a manual pace from the no-motion screen, don't let that
  // screen re-trap them (e.g. recalibrate clears paceLocked) for the session.
  const [noMotionDismissed, setNoMotionDismissed] = useState(false);
  const [playback, setPlayback] = useState<{ position: number; duration: number | null }>({
    position: 0,
    duration: null,
  });
  // On track change the system player can briefly still report the previous
  // song's position; ignore reads for a beat so the bar doesn't flash stale.
  const trackChangeHoldUntil = useRef(0);

  // Guided tour: scripted spotlight steps over the session screen.
  const heroRef = useRef<View>(null);
  const lockRef = useRef<View>(null);
  const songRef = useRef<View>(null);
  const pillsRef = useRef<View>(null);
  const holdRef = useRef<View>(null);
  const { tour, step, targetRect } = useTourSpotlight('active', {
    hero: heroRef,
    lock: lockRef,
    song: songRef,
    pills: pillsRef,
    hold: holdRef,
  });

  useEffect(() => {
    if (isDemo) return; // demo: no engine, no sensors, no persistence

    const engine = engineRef.current;
    engine.onStateChange(setState);

    isAvailable().then(setMusicAvailable);
    canReadMotion().then(setMotionOk);

    (async () => {
      if (resume === '1') {
        const snap = await loadPersisted();
        if (snap && shouldResume(snap, Date.now())) {
          await engine.resumeFrom(snap);
          return;
        }
      }
      await clearPersisted();           // fresh start supersedes any old snapshot
      await engine.start({ vibe });
    })().catch((e) => setError(String(e)));

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') engine.persistNow();
      else if (next === 'active') {
        engine.seedCadenceFromHistory().catch(() => {});
        canReadMotion().then(setMotionOk); // they may have toggled motion in Settings
      }
    });

    return () => {
      sub.remove();
      engine.stop();
    };
  }, []);

  // While calibrating, re-probe motion every few seconds. This catches a late
  // denial (the OS prompt fired lazily and the user dismissed it), AND — crucially
  // — recovers if a probe throws transiently: we keep probing regardless of the
  // current motionOk value, so a one-off failure can't permanently strand the user
  // on the no-motion screen. Stops once calibration ends (e.g. manual pace).
  useEffect(() => {
    if (isDemo || !state?.isCalibrating) return;
    const id = setInterval(() => canReadMotion().then(setMotionOk), 3000);
    return () => clearInterval(id);
  }, [state?.isCalibrating]);

  // Poll playback position while a track is loaded so the progress bar advances.
  const trackId = state?.currentTrack?.id;
  useEffect(() => {
    if (isDemo) return; // demo shows a static bar
    if (!trackId) {
      setPlayback({ position: 0, duration: null });
      return;
    }
    // New track: blank the bar and hold off reads until the player catches up,
    // so we never flash the previous song's position.
    setPlayback({ position: 0, duration: null });
    trackChangeHoldUntil.current = Date.now() + 1000;
    let active = true;
    const tick = () =>
      getPlaybackStatus()
        .then((s) => {
          if (!active || Date.now() < trackChangeHoldUntil.current) return;
          setPlayback({ position: s.position, duration: s.duration });
        })
        .catch(() => {});
    tick();
    const id = setInterval(tick, 500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [trackId]);

  async function handleEnd() {
    if (isDemo) {
      // Performing the hold IS the final step's action. Advancing past it sets
      // tour.finished, and home shows the closing card.
      if (step?.id === 'active-hold') tour.advance();
      router.replace('/home');
      return;
    }
    if (tour.running) tour.skip(); // a real session ending mid-tour bails cleanly
    const engine = engineRef.current;
    const summary = engine.getSummary();
    await engine.stop();
    router.replace({ pathname: '/end', params: { summary: JSON.stringify(summary) } });
  }

  function handleSkipTour() {
    tour.skip();
    if (isDemo) router.replace('/home'); // the demo session only exists for the tour
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.endBtn} onPress={() => router.back()}>
          <Text style={styles.endBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return <View style={styles.container}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  const engine = engineRef.current;

  // No-motion state: motion is unavailable and the user hasn't fallen back to a
  // manual pace yet. Show recoverable options instead of spinning in "Finding
  // your pace". `noMotionDismissed` keeps recalibrate (which clears paceLocked)
  // from re-trapping them here for the rest of the session. Never in demo mode.
  if (!isDemo && motionOk === false && !state.paceLocked && !noMotionDismissed) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <NoMotionState
          onOpenSettings={() => Linking.openSettings().catch(() => {})}
          onSetPace={() => setPaceModal(true)}
        />
        <ManualPaceModal
          visible={paceModal}
          onClose={() => setPaceModal(false)}
          onConfirm={(spm) => {
            setNoMotionDismissed(true);
            engine.setManualPace(spm).catch((e) => console.warn('[active] setManualPace failed:', e));
          }}
        />
      </SafeAreaView>
    );
  }

  const s = state;
  const inPocket = state.inThePocket;
  const heroValue = inPocket
    ? state.managedCadence
    : state.perceivedCadence > 0 ? state.perceivedCadence : '··';

  // One message for the reserved slot, chosen by priority, so nothing reflows the ring.
  function renderMessage() {
    if (s.notice) return <Text style={styles.msgAccent}>{s.notice}</Text>;
    if (s.isLoadingTracks)
      return (
        <View style={styles.msgRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.msgAccent}>Finding songs for your pace…</Text>
        </View>
      );
    if (s.isCalibrating)
      return (
        <Text style={styles.msgMuted} numberOfLines={1}>
          {tour.running ? FIRST_RUN_REASSURANCE : 'Start moving to match the beat.'}
        </Text>
      );
    if (!inPocket && s.managedCadence > 0)
      return (
        <View style={styles.chip}>
          <Text style={styles.chipText}>Matching {s.managedCadence}</Text>
        </View>
      );
    return null; // in the pocket: calm, no message
  }

  // Playback/native actions can reject (e.g. a MusicKit hiccup, skip at a queue
  // edge); swallow so a transient failure never surfaces as an uncaught-promise
  // crash banner. In demo mode every action is a no-op.
  const run = (action: () => Promise<unknown>) => {
    if (isDemo) return;
    action().catch((e) => console.warn('[active] action failed:', e));
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.spacer} />

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, (state.inThePocket || state.paceLocked) ? styles.dotLocked : styles.dotCalibrating]} />
        <Text style={styles.statusText}>
          {sessionStatusLabel(state)}
        </Text>
        <View ref={lockRef} collapsable={false}>
          <PressableScale hitSlop={14} onPress={() => run(() => Promise.resolve(engine.setPaceLocked(!state.paceLocked)))}>
            <SymbolView
              name={state.paceLocked ? 'lock.fill' : 'lock.open.fill'}
              size={18}
              type="monochrome"
              tintColor={state.paceLocked ? colors.accent : colors.faint}
            />
          </PressableScale>
        </View>
      </View>

      <View ref={heroRef} collapsable={false}>
        <CadenceRing value={heroValue} active={inPocket} closeness={state.pocketCloseness} />
      </View>

      <View style={styles.messageSlot}>{renderMessage()}</View>

      <View ref={songRef} collapsable={false} style={styles.songArea}>
        {state.currentTrack ? (
            <View style={styles.trackBlock}>
            <View style={styles.trackCard}>
              {state.currentTrack.albumArtUrl ? (
                <Image source={{ uri: state.currentTrack.albumArtUrl }} style={styles.albumArt} />
              ) : null}
              <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{state.currentTrack.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{state.currentTrack.artist}</Text>
                <Text style={styles.trackBpm}>
                  {Math.round(state.currentTrack.tempo)} BPM
                  {state.currentTrack.matchMultiple === 2
                    ? ' (×2)'
                    : state.currentTrack.matchMultiple === 0.5
                      ? ' (½×)'
                      : ''}
                </Text>
              </View>
              <View style={styles.inlineControls}>
                <PressableScale hitSlop={12} onPress={() => run(() => engine.skipPrevious())}>
                  <SymbolView name="backward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </PressableScale>
                <PressableScale hitSlop={12} onPress={() => run(() => engine.togglePlayPause())}>
                  <SymbolView
                    name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                    size={22}
                    type="monochrome"
                    tintColor={colors.text}
                  />
                </PressableScale>
                <PressableScale hitSlop={12} onPress={() => run(() => engine.skipNext())}>
                  <SymbolView name="forward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </PressableScale>
              </View>
            </View>
            <ProgressBar
              position={isDemo ? 76 : playback.position}
              duration={isDemo ? 200 : playback.duration}
            />
            </View>
          ) : (
            !state.isCalibrating && !state.isLoadingTracks ? (
              <Text style={styles.noMusicLabel}>No songs matched your pace yet.</Text>
            ) : null
          )}
        </View>

        {!isDemo && !musicAvailable && (
          <Text style={styles.noMusicLabel}>Enable Apple Music for playback control</Text>
        )}

        <View ref={pillsRef} collapsable={false} style={styles.pillRow}>
          <PressableScale style={styles.pill} onPress={() => { if (!isDemo) setPaceModal(true); }}>
            <Text style={styles.secondaryBtnText}>Set pace</Text>
          </PressableScale>
          {(isDemo || motionOk !== false) && (
            <PressableScale style={styles.pill} onPress={() => { if (!isDemo) engine.recalibrate(); }}>
              <Text style={styles.secondaryBtnText}>↺  Recalibrate</Text>
            </PressableScale>
          )}
        </View>

      <View ref={holdRef} collapsable={false} style={styles.holdWrap}>
        <HoldToEnd onEnd={handleEnd} duration={1000} />
      </View>

      <View style={styles.spacerBottom} />

      <ManualPaceModal
        visible={paceModal}
        onClose={() => setPaceModal(false)}
        onConfirm={(spm) => run(() => engine.setManualPace(spm))}
      />

      {step && targetRect && (
        <SpotlightOverlay
          targetRect={targetRect}
          copy={step.copy}
          onDismiss={step.advance === 'tap' ? tour.advance : undefined}
          onSkip={handleSkipTour}
          cardPosition={step.cardPosition}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 28, alignItems: 'center' },
  spacer: { flex: 1 },
  spacerBottom: { flex: 1.3 }, // slightly more space below = group sits a hair above center
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 22 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotLocked: { backgroundColor: colors.accent },
  dotCalibrating: { backgroundColor: colors.muted },
  statusText: { color: colors.muted, fontSize: 14 },
  messageSlot: { height: 32, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgMuted: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  msgAccent: { color: colors.accent, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  songArea: { minHeight: 72, width: '100%', justifyContent: 'center', marginTop: 10 },
  chip: { backgroundColor: colors.accentSoft, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 5 },
  chipText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 32 },
  holdWrap: { width: '100%', marginTop: 18 },
  pill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 50, paddingVertical: 11, paddingHorizontal: 20 },
  trackBlock: { width: '100%' },
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: 2 },
  albumArt: { width: 56, height: 56, borderRadius: 8 },
  trackInfo: { flex: 1 },
  trackName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  trackArtist: { color: colors.muted, fontSize: 14, marginTop: 2 },
  trackBpm: { color: colors.accent, fontSize: 12, marginTop: 4 },
  inlineControls: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  noMusicLabel: { color: colors.disabled, fontSize: 13, marginBottom: 16 },
  secondaryBtnText: { color: colors.muted, fontSize: 16 },
  endBtn: { paddingVertical: 12, paddingHorizontal: 28 },
  endBtnText: { color: colors.disabled, fontSize: 16 },
  error: { color: colors.danger, fontSize: 17, textAlign: 'center', marginBottom: 32 },
});
