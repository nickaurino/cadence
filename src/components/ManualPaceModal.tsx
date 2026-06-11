import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors } from '@/theme/colors';
import { CADENCE_FLOOR, CADENCE_CEILING } from '@/types';
import {
  RUN_EFFORTS,
  WALK_MPH_STEP,
  walkingCadenceFromMph,
  clampWalkMph,
} from '@/engine/pace';

type Mode = 'run' | 'walk';

// The wheel's bounds ARE the human guard rails — sourced from the constants so
// they can't drift apart again (a hardcoded 250 max let users lock a pace the
// detection band treats as sensor noise).
const MIN = CADENCE_FLOOR;
const MAX = CADENCE_CEILING;
const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE;
const PAD = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
const DEFAULT = 172;

const VALUES = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);

// Labels on the paces worth knowing. Running cadence is near-constant, so these
// anchor the user around sensible targets.
const KEY_PACES: Record<number, string> = {
  120: 'brisk walk',
  165: 'easy run',
  175: 'typical run',
  185: 'fast run',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (spm: number) => void;
}

export function ManualPaceModal({ visible, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState(DEFAULT);
  const [mode, setMode] = useState<Mode>('run');
  const [mph, setMph] = useState(3.0);
  const scrollRef = useRef<ScrollView>(null);

  function scrollToValue(v: number) {
    scrollRef.current?.scrollTo?.({ y: (v - MIN) * ITEM_HEIGHT, animated: false });
  }

  // The wheel is the source of truth; the assist chips/stepper just set it and
  // scroll it into view, so the exact-number override stays available.
  function applyValue(v: number) {
    setSelected(v);
    scrollToValue(v);
  }

  function selectMode(next: Mode) {
    setMode(next);
    if (next === 'walk') applyValue(walkingCadenceFromMph(mph)); // reflect mph immediately
  }

  function stepMph(delta: number) {
    const next = clampWalkMph(mph + delta);
    setMph(next);
    applyValue(walkingCadenceFromMph(next));
  }

  // Position the wheel under the center band whenever the sheet opens. Done
  // imperatively through a ref rather than a `contentOffset` prop: a render-time
  // contentOffset gets re-applied by iOS on every re-render, and since each
  // scroll updates `selected` (a re-render), the wheel would be yanked back to
  // its start on every drag. Depending only on `visible` keeps repositioning
  // out of the drag path.
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => scrollToValue(selected));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const v = Math.min(MAX, Math.max(MIN, MIN + idx));
    if (v !== selected) setSelected(v);
  }

  function confirm() {
    onConfirm(selected);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Catches taps outside the sheet to close. It sits behind the sheet,
            so it never intercepts the wheel's scroll gesture (a Pressable
            wrapping the ScrollView would steal the drag). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Set your pace</Text>
          <Text style={styles.sub}>
            {mode === 'run' ? 'Pick how hard you are running.' : 'Enter your walking speed.'}
          </Text>

          <View style={styles.modeRow}>
            {(['run', 'walk'] as Mode[]).map((m) => (
              <Pressable
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => selectMode(m)}
              >
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m === 'run' ? 'Run' : 'Walk'}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'run' ? (
            <View style={styles.chipRow}>
              {RUN_EFFORTS.map((e) => {
                const active = selected === e.spm;
                return (
                  <Pressable
                    key={e.label}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => applyValue(e.spm)}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{e.label}</Text>
                    <Text style={[styles.chipSpm, active && styles.chipSpmActive]}>{e.spm}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepBtn} onPress={() => stepMph(-WALK_MPH_STEP)}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <View style={styles.stepReadout}>
                <Text style={styles.stepMph}>{mph.toFixed(1)} mph</Text>
                <Text style={styles.stepSpm}>≈ {walkingCadenceFromMph(mph)} spm</Text>
              </View>
              <Pressable style={styles.stepBtn} onPress={() => stepMph(WALK_MPH_STEP)}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.assistNote}>An estimate to get you close. Fine-tune on the wheel.</Text>

          <View style={styles.wheelWrap}>
            <View style={styles.centerBand} pointerEvents="none" />
            <ScrollView
              ref={scrollRef}
              testID="pace-wheel"
              style={{ height: WHEEL_HEIGHT }}
              contentContainerStyle={{ paddingVertical: PAD }}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onLayout={() => scrollToValue(selected)}
            >
              {VALUES.map((v) => {
                const active = v === selected;
                return (
                  <View key={v} style={styles.item}>
                    <Text style={[styles.itemNum, active && styles.itemNumActive]}>{v}</Text>
                    {KEY_PACES[v] && (
                      <Text style={[styles.itemTag, active && styles.itemTagActive]}>
                        {KEY_PACES[v]}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <Pressable style={styles.setBtn} onPress={confirm}>
            <Text style={styles.setBtnText}>Set {selected} spm</Text>
          </Pressable>
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 44 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub: { color: colors.muted, fontSize: 14, marginBottom: 14 },
  modeRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, gap: 4, marginBottom: 14 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.surfaceHigh },
  modeText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  modeTextActive: { color: colors.text },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  chip: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 2 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  chipLabelActive: { color: colors.accent },
  chipSpm: { color: colors.disabled, fontSize: 12 },
  chipSpmActive: { color: colors.accent },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  stepBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: colors.text, fontSize: 26, fontWeight: '600' },
  stepReadout: { flex: 1, alignItems: 'center' },
  stepMph: { color: colors.text, fontSize: 22, fontWeight: '700' },
  stepSpm: { color: colors.accent, fontSize: 13, marginTop: 2 },
  assistNote: { color: colors.faint, fontSize: 12, marginBottom: 14 },
  wheelWrap: { height: WHEEL_HEIGHT, marginBottom: 20 },
  centerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemNum: { color: colors.disabled, fontSize: 20 },
  itemNumActive: { color: colors.text, fontSize: 30, fontWeight: '700' },
  // Floated to the right edge so the label never pushes the number off-center.
  itemTag: { position: 'absolute', right: 24, height: ITEM_HEIGHT, lineHeight: ITEM_HEIGHT, color: colors.disabled, fontSize: 12 },
  itemTagActive: { color: colors.accent, fontSize: 13 },
  setBtn: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  setBtnText: { color: colors.onAccent, fontSize: 17, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.muted, fontSize: 16 },
});
