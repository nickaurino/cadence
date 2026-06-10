import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/colors';

interface Props {
  onDone: () => void;
}

// Final card of the guided tour, shown on the home screen after the user ends
// the demo session. Over-explains on purpose: each named setting gets one plain
// sentence, so nothing is vague. No forced Settings detour.
export function TourHandoff({ onDone }: Props) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>That's the tour</Text>
        <Text style={styles.body}>
          You're ready to run. The defaults work well for most people, but everything
          can be tuned in Settings:
        </Text>
        <View style={styles.item}>
          <Text style={styles.itemName}>Pace sensitivity</Text>
          <Text style={styles.itemDesc}>How quickly the music reacts when your pace changes.</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemName}>Song switching</Text>
          <Text style={styles.itemDesc}>
            Whether new songs cut in right away or wait for the current song to finish.
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemName}>Tempo matching</Text>
          <Text style={styles.itemDesc}>
            Which songs count as a match: exact tempo, half time, or double time.
          </Text>
        </View>
        <Text style={styles.footer}>
          Find them anytime under the gear icon, top right.
        </Text>
        <PressableScale style={styles.primary} onPress={onDone}>
          <Text style={styles.primaryText}>Let's run</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 24 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  item: { marginBottom: 12 },
  itemName: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemDesc: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  footer: { color: colors.faint, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 20 },
  primary: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
});
