import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MatchSettings, DEFAULT_MATCH_SETTINGS } from '@/types';
import { getMatchSettings, saveMatchSettings, resetOnboarding, setTourEnabled } from '@/storage/store';
import { colors } from '@/theme/colors';

const STRICTNESS: { label: string; tolerance: number }[] = [
  { label: 'Tight', tolerance: 0.03 },
  { label: 'Normal', tolerance: 0.06 },
  { label: 'Loose', tolerance: 0.1 },
];

export default function Settings() {
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_MATCH_SETTINGS);

  useEffect(() => {
    getMatchSettings().then(setSettings);
  }, []);

  function update(patch: Partial<MatchSettings>) {
    const next = { ...settings, ...patch };
    // Never leave zero match modes — fall back to exact.
    if (!next.exact && !next.halfTime && !next.doubleTime) next.exact = true;
    setSettings(next);
    saveMatchSettings(next);
  }

  const enabledModes = [settings.exact, settings.halfTime, settings.doubleTime].filter(Boolean).length;

  async function restartOnboarding() {
    await resetOnboarding();
    await setTourEnabled(false); // completing onboarding re-arms the tour
    router.replace('/onboarding'); // the full first-run flow: onboarding, then the guided tour
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>TEMPO MATCHING</Text>
        <View style={styles.group}>
          <Row
            title="Exact tempo"
            sub="Songs whose beat lands on your cadence."
            value={settings.exact}
            onValueChange={(v) => update({ exact: v })}
          />
          <Row
            title="Half-time"
            sub="Songs at half your cadence (a 90 BPM track for a 180 step rate). Biggest variety boost."
            value={settings.halfTime}
            onValueChange={(v) => update({ halfTime: v })}
          />
          <Row
            title="Double-time"
            sub="Songs at double your cadence. Useful for slow walks."
            value={settings.doubleTime}
            onValueChange={(v) => update({ doubleTime: v })}
            last
          />
        </View>
        {enabledModes <= 1 && (
          <Text style={styles.warning}>
            Narrowing matches this much leaves far fewer songs, so you may hear repeats.
          </Text>
        )}

        <Text style={styles.sectionLabel}>STRICTNESS</Text>
        <View style={styles.segment}>
          {STRICTNESS.map((s) => {
            const active = Math.abs(settings.tolerance - s.tolerance) < 0.001;
            return (
              <Pressable
                key={s.label}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => update({ tolerance: s.tolerance })}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Looser matching gives more songs but a slightly less exact beat.</Text>

        <Text style={styles.sectionLabel}>PACE SENSITIVITY</Text>
        <View style={styles.segment}>
          {([
            ['responsive', 'Responsive'],
            ['balanced', 'Balanced'],
            ['relaxed', 'Relaxed'],
          ] as const).map(([val, label]) => {
            const active = settings.sensitivity === val;
            return (
              <Pressable
                key={val}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => update({ sensitivity: val })}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>How quickly the music follows when you change pace.</Text>

        <Text style={styles.sectionLabel}>SONG SWITCHING</Text>
        <View style={styles.segment}>
          {([
            ['boundary', 'At song end'],
            ['immediate', 'Immediate'],
          ] as const).map(([val, label]) => {
            const active = settings.songSwitching === val;
            return (
              <Pressable
                key={val}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => update({ songSwitching: val })}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          When your pace changes, swap at the next song or right away.
        </Text>

        <Pressable
          onPress={() => update(DEFAULT_MATCH_SETTINGS)}
          style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetText}>Reset to defaults</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.group}>
          <Pressable style={[styles.aboutRow, styles.rowDivider]} onPress={restartOnboarding}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Restart onboarding</Text>
              <Text style={styles.rowSub}>Go through the intro and guided tour again from the beginning.</Text>
            </View>
          </Pressable>
          <Pressable style={styles.aboutRow} onPress={() => router.push('/credits')}>
            <Text style={styles.rowTitle}>Credits</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  title,
  sub,
  value,
  onValueChange,
  last,
}: {
  title: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.accent, false: colors.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '800' },
  done: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  content: { padding: 24, paddingTop: 8 },
  sectionLabel: { color: colors.faint, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 10, marginTop: 24 },
  group: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  chevron: { color: colors.faint, fontSize: 22, fontWeight: '400' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
  rowSub: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  warning: { color: colors.muted, fontSize: 13, marginTop: 10, lineHeight: 18 },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: 9, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  segmentTextActive: { color: colors.onAccent },
  hint: { color: colors.faint, fontSize: 13, marginTop: 10, lineHeight: 18 },
  reset: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetPressed: { backgroundColor: colors.border, opacity: 0.85 },
  resetText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
