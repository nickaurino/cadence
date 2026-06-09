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

const MIN = 50;
const MAX = 250;
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
  const scrollRef = useRef<ScrollView>(null);

  function scrollToValue(v: number) {
    scrollRef.current?.scrollTo?.({ y: (v - MIN) * ITEM_HEIGHT, animated: false });
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
          <Text style={styles.sub}>Scroll to your steps per minute.</Text>

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
  sub: { color: colors.muted, fontSize: 14, marginBottom: 12 },
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
