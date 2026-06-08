import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionSummary } from '@/types';

function parseSummary(raw?: string): SessionSummary | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionSummary;
  } catch {
    return null;
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EndSession() {
  const { summary } = useLocalSearchParams<{ summary?: string }>();
  const s = parseSummary(summary);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nice work.</Text>

      {s ? (
        <View style={styles.stats}>
          <Stat label="Time" value={formatDuration(s.durationSec)} />
          <Stat label="Avg cadence" value={`${s.avgCadence}`} unit="spm" />
          <Stat label="Steps" value={s.steps.toLocaleString()} />
          <Stat label="Distance" value={`~${s.distanceMi}`} unit="mi" />
          <Stat label="Songs" value={`${s.songsPlayed}`} />
        </View>
      ) : (
        <Text style={styles.body}>Session complete. Keep it up!</Text>
      )}

      <Pressable style={styles.doneBtn} onPress={() => router.replace('/home')}>
        <Text style={styles.doneBtnText}>Done</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 28 },
  body: { fontSize: 17, color: '#aaa', textAlign: 'center', marginBottom: 40, lineHeight: 26 },
  stats: { width: '100%', backgroundColor: '#161616', borderRadius: 16, paddingVertical: 6, marginBottom: 40 },
  stat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  statLabel: { color: '#888', fontSize: 15 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statUnit: { color: '#1DB954', fontSize: 14, fontWeight: '600' },
  doneBtn: { backgroundColor: '#1DB954', borderRadius: 50, paddingVertical: 16, paddingHorizontal: 40 },
  doneBtnText: { color: '#000', fontSize: 17, fontWeight: '600' },
});
