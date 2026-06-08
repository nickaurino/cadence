import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionEngine } from '@/engine/session';
import { isAvailable } from '@/music/auth';
import { ManualPaceModal } from '@/components/ManualPaceModal';
import { SessionState, Vibe } from '@/types';

export default function ActiveSession() {
  const { vibe } = useLocalSearchParams<{ vibe: Vibe }>();
  const engineRef = useRef(new SessionEngine());
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [paceModal, setPaceModal] = useState(false);

  useEffect(() => {
    const engine = engineRef.current;
    engine.onStateChange(setState);

    isAvailable().then(setMusicAvailable);

    engine.start({ vibe }).catch((e) => {
      setError(String(e));
    });

    return () => { engine.stop(); };
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
    return <View style={styles.container}><ActivityIndicator color="#1DB954" size="large" /></View>;
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
            tintColor={state.paceLocked ? '#1DB954' : '#777'}
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
          <ActivityIndicator color="#f5a623" />
          <Text style={styles.calibratingText}>
            Start moving and we&apos;ll match music to your rhythm.
          </Text>
        </View>
      )}

      {state.isLoadingTracks && (
        <View style={styles.calibrating}>
          <ActivityIndicator color="#1DB954" />
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
              <SymbolView name="backward.end.fill" size={20} type="monochrome" tintColor="#fff" />
            </Pressable>
            <Pressable hitSlop={12} onPress={() => engine.togglePlayPause()}>
              <SymbolView
                name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                size={22}
                type="monochrome"
                tintColor="#fff"
              />
            </Pressable>
            <Pressable hitSlop={12} onPress={() => engine.skipNext()}>
              <SymbolView name="forward.end.fill" size={20} type="monochrome" tintColor="#fff" />
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
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 32, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotLocked: { backgroundColor: '#1DB954' },
  dotCalibrating: { backgroundColor: '#f5a623' },
  statusText: { color: '#aaa', fontSize: 14 },
  notice: { color: '#f5a623', fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  bpmLabel: { color: '#aaa', fontSize: 16, marginBottom: 4 },
  bpmValue: { color: '#fff', fontSize: 88, fontWeight: '800', lineHeight: 96 },
  bpmUnit: { color: '#555', fontSize: 14, marginBottom: 12 },
  managed: { color: '#1DB954', fontSize: 14, marginBottom: 36 },
  calibrating: { alignItems: 'center', gap: 12, marginBottom: 32 },
  calibratingText: { color: '#f5a623', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  loadingText: { color: '#1DB954', fontSize: 15, textAlign: 'center' },
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: 40 },
  albumArt: { width: 56, height: 56, borderRadius: 8 },
  trackInfo: { flex: 1 },
  trackName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  trackArtist: { color: '#aaa', fontSize: 14, marginTop: 2 },
  trackBpm: { color: '#1DB954', fontSize: 12, marginTop: 4 },
  inlineControls: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  noMusicLabel: { color: '#555', fontSize: 13, marginBottom: 16 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#333', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28, marginBottom: 14 },
  secondaryBtnText: { color: '#aaa', fontSize: 16 },
  endBtn: { paddingVertical: 12, paddingHorizontal: 28 },
  endBtnText: { color: '#555', fontSize: 16 },
  error: { color: '#ff4444', fontSize: 17, textAlign: 'center', marginBottom: 32 },
});
