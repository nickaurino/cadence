import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/colors';

interface Props {
  onReal: () => void;
  onDemo: () => void;
}

// Shown when the tour reaches the session step: take a real session (music and
// step detection live underneath the tour) or a simulated look around (no
// engine, canned session state). Both land on the same session walkthrough.
export function TourModeChoice({ onReal, onDemo }: Props) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>How do you want to see it?</Text>
        <Text style={styles.body}>
          Take a real session with your music, or just look around first. Same tour
          either way.
        </Text>
        <PressableScale style={styles.primary} onPress={onReal}>
          <Text style={styles.primaryText}>Real session</Text>
        </PressableScale>
        <PressableScale style={styles.secondary} onPress={onDemo}>
          <Text style={styles.secondaryText}>Just show me around</Text>
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
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: 24 },
  primary: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  secondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
