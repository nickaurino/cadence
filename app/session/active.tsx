import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, AppState } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionEngine } from '@/engine/session';
import { isAvailable } from '@/music/auth';
import { loadPersisted, shouldResume, clearPersisted } from '@/storage/session-store';
import { ManualPaceModal } from '@/components/ManualPaceModal';
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

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, state.isCalibrating ? styles.dotCalibrating : styles.dotLocked]} />
        <Text style={styles.statusText}>
          {state.isCalibrating ? 'Finding your pace' : state.paceLocked ? 'Pace locked' : 'Tracking'}
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

      {state.notice && <Text style={styles.notice}>{state.notice}</Text>}

      <Text style={styles.bpmLabel}>Your pace</Text>
      <Text style={styles.bpmValue}>
        {state.perceivedCadence > 0 ? state.perceivedCadence : '··'}
      </Text>
      <Text style={styles.bpmUnit}>steps / min</Text>

      {state.managedCadence > 0 && (
        <Text style={styles.managed}>Matching {state.managedCadence} spm</Text>
      )}

      {state.isCalibrating && (
        <View style={styles.calibrating}>
          <ActivityIndicator color={colors.muted} />
          <Text style={styles.calibratingText}>
            Start moving and we&apos;ll match music to your rhythm.
          </Text>
        </View>
      )}

      {state.isLoadingTracks && (
        <View style={styles.calibrating}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Finding songs for your pace…</Text>
        </View>
      )}

      {!state.isCalibrating && !state.isLoadingTracks && !state.currentTrack && (
        <Text style={styles.noMusicLabel}>No songs matched your pace yet.</Text>
      )}

      {state.currentTrack && (
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
      )}

      {!musicAvailable && (
        <Text style={styles.noMusicLabel}>Enable Apple Music for playback control</Text>
      )}

      <Pressable style={styles.secondaryBtn} onPress={() => setPaceModal(true)}>
        <Text style={styles.secondaryBtnText}>Set pace manually</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => engine.recalibrate()}>
        <Text style={styles.secondaryBtnText}>↺  Recalibrate</Text>
      </Pressable>

      <Pressable style={styles.endBtn} onPress={handleEnd}>
        <Text style={styles.endBtnText}>End session</Text>
      </Pressable>

      <ManualPaceModal
        visible={paceModal}
        onClose={() => setPaceModal(false)}
        onConfirm={(spm) => engine.setManualPace(spm)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 32, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotLocked: { backgroundColor: colors.accent },
  dotCalibrating: { backgroundColor: colors.muted },
  statusText: { color: colors.muted, fontSize: 14 },
  notice: { color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  bpmLabel: { color: colors.muted, fontSize: 16, marginBottom: 4 },
  bpmValue: { color: colors.text, fontSize: 88, fontWeight: '800', lineHeight: 96 },
  bpmUnit: { color: colors.disabled, fontSize: 14, marginBottom: 12 },
  managed: { color: colors.accent, fontSize: 14, marginBottom: 36 },
  calibrating: { alignItems: 'center', gap: 12, marginBottom: 32 },
  calibratingText: { color: colors.muted, fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  loadingText: { color: colors.accent, fontSize: 15, textAlign: 'center' },
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: 40 },
  albumArt: { width: 56, height: 56, borderRadius: 8 },
  trackInfo: { flex: 1 },
  trackName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  trackArtist: { color: colors.muted, fontSize: 14, marginTop: 2 },
  trackBpm: { color: colors.accent, fontSize: 12, marginTop: 4 },
  inlineControls: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  noMusicLabel: { color: colors.disabled, fontSize: 13, marginBottom: 16 },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28, marginBottom: 14 },
  secondaryBtnText: { color: colors.muted, fontSize: 16 },
  endBtn: { paddingVertical: 12, paddingHorizontal: 28 },
  endBtnText: { color: colors.disabled, fontSize: 16 },
  error: { color: colors.danger, fontSize: 17, textAlign: 'center', marginBottom: 32 },
});
