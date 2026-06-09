import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SessionSummary } from '@/types';
import { colors } from '@/theme/colors';
import { PressableScale } from '@/components/PressableScale';

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Nice work.</Text>

        {s ? (
          <>
            <View style={styles.hero}>
              <View style={styles.ring}>
                <View style={styles.disc}>
                  <Text style={styles.heroValue}>{s.avgCadence}</Text>
                  <Text style={styles.heroLabel}>AVG SPM</Text>
                </View>
              </View>
            </View>

            <View style={styles.stats}>
              <Stat label="Time" value={formatDuration(s.durationSec)} />
              <Stat label="Steps" value={s.steps.toLocaleString()} />
              <Stat label="Distance" value={`~${s.distanceMi}`} unit="mi" />
              <Stat label="Songs" value={`${s.songsPlayed}`} />
            </View>
          </>
        ) : (
          <Text style={styles.body}>Session complete. Keep it up!</Text>
        )}

        <PressableScale style={styles.doneBtn} onPress={() => router.replace('/home')}>
          <Text style={styles.doneBtnText}>Done</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
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

const RING_SIZE = 150;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: colors.text, marginBottom: 36 },
  body: { fontSize: 17, color: colors.muted, textAlign: 'center', marginBottom: 40, lineHeight: 26 },

  hero: { marginBottom: 36, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 9,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowRadius: 20,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  disc: {
    flex: 1,
    alignSelf: 'stretch',
    margin: 6,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: { fontSize: 52, fontWeight: '800', color: colors.accent, textAlign: 'center' },
  heroLabel: { marginTop: 4, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted },

  stats: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 6, marginBottom: 40 },
  stat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  statLabel: { color: colors.muted, fontSize: 15 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statUnit: { color: colors.accent, fontSize: 14, fontWeight: '600' },

  doneBtn: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 44, marginTop: 8 },
  doneBtnText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
