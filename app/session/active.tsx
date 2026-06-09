import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, AppState, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionEngine } from '@/engine/session';
import { sessionStatusLabel } from '@/engine/status';
import { isAvailable } from '@/music/auth';
import { loadPersisted, shouldResume, clearPersisted } from '@/storage/session-store';
import { hasCompletedOnboarding, markOnboardingComplete } from '@/storage/store';
import { FIRST_RUN_REASSURANCE } from '@/onboarding/copy';
import { ManualPaceModal } from '@/components/ManualPaceModal';
import { CadenceRing } from '@/components/CadenceRing';
import { HoldToEnd } from '@/components/HoldToEnd';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/ProgressBar';
import { NoMotionState } from '@/components/NoMotionState';
import { SpotlightOverlay, TargetRect } from '@/components/SpotlightOverlay';
import { TourHandoff } from '@/components/TourHandoff';
import { getPlaybackStatus } from '@/music/player';
import { canReadMotion } from '@/sensors/cadence';
import { useTour } from '@/tour/TourContext';
import { CoachmarkId } from '@/tour/tourState';
import { COACHMARK_COPY } from '@/tour/coachmarks';
import { SessionState, Vibe } from '@/types';
import { colors } from '@/theme/colors';

export default function ActiveSession() {
  const { vibe, resume } = useLocalSearchParams<{ vibe: Vibe; resume?: string }>();
  const engineRef = useRef(new SessionEngine());
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [paceModal, setPaceModal] = useState(false);
  // null = not yet checked; false = motion unavailable (no-motion state)
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  // True for the very first session (onboarding wasn't complete on mount) so the
  // pre-music wait can show a reassurance line.
  const [firstRun, setFirstRun] = useState(false);
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

  // Feature tour (coachmarks). Refs mark the spotlight targets; we measure the
  // requested one into the overlay's screen-coordinate space.
  const tour = useTour();
  const heroRef = useRef<View>(null);
  const messageRef = useRef<View>(null);
  const lockRef = useRef<View>(null);
  const holdRef = useRef<View>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [showHandoff, setShowHandoff] = useState(false);
  // null = baseline not yet set; tracks allSeen to detect the in-session transition.
  const prevAllSeen = useRef<boolean | null>(null);
  // holdToEnd coachmark becomes eligible after the session has run a bit.
  const [holdHintReady, setHoldHintReady] = useState(false);

  const refFor: Record<CoachmarkId, React.RefObject<View | null>> = {
    onTheBeat: heroRef,
    paceShift: messageRef,
    paceLock: lockRef,
    holdToEnd: holdRef,
  };

  // Measure a target into screen coords (pageX/pageY) and request its coachmark.
  function requestCoachmark(id: CoachmarkId) {
    const node = refFor[id].current;
    if (!node) return;
    node.measure((_x, _y, width, height, pageX, pageY) => {
      if (width === 0 && height === 0) return; // not laid out yet
      setTargetRect({ x: pageX, y: pageY, width, height });
      tour.request(id);
    });
  }

  function dismissCoachmark(id: CoachmarkId) {
    tour.dismiss(id);
    setTargetRect(null);
  }

  useEffect(() => {
    const t = setTimeout(() => setHoldHintReady(true), 45000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.onStateChange(setState);

    isAvailable().then(setMusicAvailable);
    canReadMotion().then(setMotionOk);

    // Reaching a session is what completes onboarding (idempotent). If it wasn't
    // complete on mount, this is the first session -> enable the reassurance line.
    hasCompletedOnboarding().then((done) => {
      if (!done) setFirstRun(true);
      markOnboardingComplete().catch(() => {});
    });

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

  // While calibrating with motion still presumed OK, re-check periodically: a
  // brand-new user can deny the OS motion prompt mid-session (it fired lazily on
  // the first step subscription), and we want the no-motion state to catch that
  // instead of spinning forever in "Finding your pace".
  useEffect(() => {
    if (!state?.isCalibrating || motionOk === false) return;
    const id = setInterval(() => canReadMotion().then(setMotionOk), 3000);
    return () => clearInterval(id);
  }, [state?.isCalibrating, motionOk]);

  // Poll playback position while a track is loaded so the progress bar advances.
  const trackId = state?.currentTrack?.id;
  useEffect(() => {
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

  // Coachmark triggers. Each fires once (gated by its seen flag in TourContext)
  // when its real moment arrives. One shows at a time (tour.current guard). No
  // coachmarks in the no-motion fallback. See ADR 0005 / the spec for the design.
  useEffect(() => {
    if (!tour.ready || tour.current || !state || motionOk === false) return;
    const s = state;
    const inPocket = s.inThePocket;

    // 1. On the beat — a REAL detected on-beat moment with music playing (never a
    //    manual lock, never pre-music). This is the aha.
    if (
      !tour.seen.onTheBeat &&
      inPocket && s.currentTrack && s.isPlaying && !s.isLoadingTracks &&
      !s.paceLocked && s.perceivedCadence > 0
    ) {
      requestCoachmark('onTheBeat');
      return;
    }
    // 2. Pace shift — perceived has moved off managed and the "Matching N" chip is up.
    if (!tour.seen.paceShift && !inPocket && s.managedCadence > 0 && !s.paceLocked && !s.isCalibrating) {
      requestCoachmark('paceShift');
      return;
    }
    // 3. Pace lock — taught after the aha, at a calm in-pocket moment.
    if (tour.seen.onTheBeat && !tour.seen.paceLock && inPocket && !s.paceLocked) {
      requestCoachmark('paceLock');
      return;
    }
    // 4. Hold to end — safety hint after the session has settled.
    if (tour.seen.onTheBeat && !tour.seen.holdToEnd && holdHintReady) {
      requestCoachmark('holdToEnd');
      return;
    }
  }, [state, tour.ready, tour.current, tour.seen, motionOk, holdHintReady]);

  // Settings handoff: show once, only when the last coachmark is seen DURING this
  // session (false -> true transition), not on every session where it's already done.
  useEffect(() => {
    if (!tour.ready) return;
    if (prevAllSeen.current === null) {
      prevAllSeen.current = tour.allSeen; // baseline at mount, no show
      return;
    }
    if (!prevAllSeen.current && tour.allSeen) setShowHandoff(true);
    prevAllSeen.current = tour.allSeen;
  }, [tour.allSeen, tour.ready]);

  async function handleEnd() {
    const engine = engineRef.current;
    const summary = engine.getSummary();
    await engine.stop();
    router.replace({ pathname: '/end', params: { summary: JSON.stringify(summary) } });
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
  // from re-trapping them here for the rest of the session.
  if (motionOk === false && !state.paceLocked && !noMotionDismissed) {
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
          {firstRun ? FIRST_RUN_REASSURANCE : 'Start moving to match the beat.'}
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
  // crash banner.
  const run = (action: Promise<unknown>) =>
    action.catch((e) => console.warn('[active] action failed:', e));

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.spacer} />

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, (state.inThePocket || state.paceLocked) ? styles.dotLocked : styles.dotCalibrating]} />
        <Text style={styles.statusText}>
          {sessionStatusLabel(state)}
        </Text>
        <View ref={lockRef} collapsable={false}>
          <PressableScale hitSlop={14} onPress={() => engine.setPaceLocked(!state.paceLocked)}>
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

      <View ref={messageRef} collapsable={false} style={styles.messageSlot}>{renderMessage()}</View>

      <View style={styles.songArea}>
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
                <PressableScale hitSlop={12} onPress={() => run(engine.skipPrevious())}>
                  <SymbolView name="backward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </PressableScale>
                <PressableScale hitSlop={12} onPress={() => run(engine.togglePlayPause())}>
                  <SymbolView
                    name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                    size={22}
                    type="monochrome"
                    tintColor={colors.text}
                  />
                </PressableScale>
                <PressableScale hitSlop={12} onPress={() => run(engine.skipNext())}>
                  <SymbolView name="forward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </PressableScale>
              </View>
            </View>
            <ProgressBar position={playback.position} duration={playback.duration} />
            </View>
          ) : (
            !state.isCalibrating && !state.isLoadingTracks ? (
              <Text style={styles.noMusicLabel}>No songs matched your pace yet.</Text>
            ) : null
          )}
        </View>

        {!musicAvailable && (
          <Text style={styles.noMusicLabel}>Enable Apple Music for playback control</Text>
        )}

        <View style={styles.pillRow}>
          <PressableScale style={styles.pill} onPress={() => setPaceModal(true)}>
            <Text style={styles.secondaryBtnText}>Set pace</Text>
          </PressableScale>
          {motionOk !== false && (
            <PressableScale style={styles.pill} onPress={() => engine.recalibrate()}>
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
        onConfirm={(spm) => run(engine.setManualPace(spm))}
      />

      {tour.current && targetRect && (
        <SpotlightOverlay
          targetRect={targetRect}
          copy={COACHMARK_COPY[tour.current]}
          onDismiss={() => dismissCoachmark(tour.current!)}
          onSkip={() => {
            tour.skipAll();
            setTargetRect(null);
          }}
          passthrough
        />
      )}

      {showHandoff && (
        <TourHandoff
          onSettings={() => {
            setShowHandoff(false);
            router.push('/settings');
          }}
          onLater={() => setShowHandoff(false)}
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
