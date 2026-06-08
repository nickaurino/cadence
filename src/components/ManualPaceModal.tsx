import { useState } from 'react';
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

const MIN = 120;
const MAX = 200;
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Set your pace</Text>
          <Text style={styles.sub}>Scroll to your steps per minute.</Text>

          <View style={styles.wheelWrap}>
            <View style={styles.centerBand} pointerEvents="none" />
            <ScrollView
              style={{ height: WHEEL_HEIGHT }}
              contentContainerStyle={{ paddingVertical: PAD }}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentOffset={{ x: 0, y: (DEFAULT - MIN) * ITEM_HEIGHT }}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#161616', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 44 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub: { color: '#888', fontSize: 14, marginBottom: 12 },
  wheelWrap: { height: WHEEL_HEIGHT, marginBottom: 20 },
  centerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a2a',
  },
  item: { height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  itemNum: { color: '#555', fontSize: 20 },
  itemNumActive: { color: '#fff', fontSize: 30, fontWeight: '700' },
  itemTag: { color: '#444', fontSize: 12 },
  itemTagActive: { color: '#1DB954', fontSize: 13 },
  setBtn: { backgroundColor: '#1DB954', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  setBtnText: { color: '#000', fontSize: 17, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: '#888', fontSize: 16 },
});
