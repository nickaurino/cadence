import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, AppState } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionEngine } from '@/engine/session';
import { isAvailable } from '@/music/auth';
import { loadPersisted, shouldResume, clearPersisted } from '@/storage/session-store';
import { ManualPaceModal } from '@/components/ManualPaceModal';
import { CadenceRing } from '@/components/CadenceRing';
import { HoldToEnd } from '@/components/HoldToEnd';
import { SessionState, Vibe } from '@/types';
import { colors } from '@/theme/colors';

export default function ActiveSession() {
  const { vibe, resume } = useLocalSearchParams<{ vibe: Vibe; resume?: string }>();
  const engineRef = useRef(new SessionEngine());
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [paceModal, setPaceModal] = useState(false);

  useEffect(() => {
    const engine = engineRef.current;
    engine.onStateChange(setState);

    isAvailable().then(setMusicAvailable);

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
      else if (next === 'active') engine.seedCadenceFromHistory().catch(() => {});
    });

    return () => {
      sub.remove();
      engine.stop();
    };
  }, []);

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
      return <Text style={styles.msgMuted}>Start moving — we&apos;ll match music to your rhythm.</Text>;
    if (!inPocket && s.managedCadence > 0)
      return (
        <View style={styles.chip}>
          <Text style={styles.chipText}>Matching {s.managedCadence}</Text>
        </View>
      );
    return null; // in the pocket: calm, no message
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, (state.inThePocket || state.paceLocked) ? styles.dotLocked : styles.dotCalibrating]} />
        <Text style={styles.statusText}>
          {state.isCalibrating ? 'Finding your pace'
            : state.paceLocked ? 'Pace locked'
            : state.inThePocket ? 'In the pocket'
            : 'Shifting'}
        </Text>
        <Pressable hitSlop={14} onPress={() => engine.setPaceLocked(!state.paceLocked)}>
          <SymbolView
            name={state.paceLocked ? 'lock.fill' : 'lock.open.fill'}
            size={18}
            type="monochrome"
            tintColor={state.paceLocked ? colors.accent : colors.faint}
          />
        </Pressable>
      </View>

      <View style={styles.heroRegion}>
        <CadenceRing value={heroValue} active={inPocket} closeness={state.pocketCloseness} />
        <View style={styles.messageSlot}>{renderMessage()}</View>
      </View>

      <View style={styles.bottomRegion}>
        <View style={styles.songArea}>
          {state.currentTrack ? (
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
                <Pressable hitSlop={12} onPress={() => engine.skipPrevious()}>
                  <SymbolView name="backward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </Pressable>
                <Pressable hitSlop={12} onPress={() => engine.togglePlayPause()}>
                  <SymbolView
                    name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                    size={22}
                    type="monochrome"
                    tintColor={colors.text}
                  />
                </Pressable>
                <Pressable hitSlop={12} onPress={() => engine.skipNext()}>
                  <SymbolView name="forward.end.fill" size={20} type="monochrome" tintColor={colors.text} />
                </Pressable>
              </View>
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
          <Pressable style={styles.pill} onPress={() => setPaceModal(true)}>
            <Text style={styles.secondaryBtnText}>Set pace</Text>
          </Pressable>
          <Pressable style={styles.pill} onPress={() => engine.recalibrate()}>
            <Text style={styles.secondaryBtnText}>↺  Recalibrate</Text>
          </Pressable>
        </View>

        <HoldToEnd onEnd={handleEnd} duration={1000} />
      </View>

      <ManualPaceModal
        visible={paceModal}
        onClose={() => setPaceModal(false)}
        onConfirm={(spm) => engine.setManualPace(spm)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 36, alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotLocked: { backgroundColor: colors.accent },
  dotCalibrating: { backgroundColor: colors.muted },
  statusText: { color: colors.muted, fontSize: 14, flex: 1 },
  heroRegion: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  messageSlot: { height: 52, marginTop: 22, alignItems: 'center', justifyContent: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgMuted: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  msgAccent: { color: colors.accent, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  bottomRegion: { width: '100%' },
  songArea: { minHeight: 92, justifyContent: 'center', marginBottom: 18 },
  chip: { backgroundColor: colors.accentSoft, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 28, marginBottom: 8 },
  pill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 50, paddingVertical: 11, paddingHorizontal: 20 },
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: 0 },
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
