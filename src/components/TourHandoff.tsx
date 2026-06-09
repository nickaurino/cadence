import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/colors';

interface Props {
  onSettings: () => void;
  onLater: () => void;
}

// Shown once after the last feature-tour coachmark is seen. Always offers an
// escape ("Maybe later") so the Settings detour is never forced.
export function TourHandoff({ onSettings, onLater }: Props) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.body}>
          These are good defaults, but pace sensitivity, song switching, and more are
          all yours to tune in Settings.
        </Text>
        <PressableScale style={styles.primary} onPress={onSettings}>
          <Text style={styles.primaryText}>Take me there</Text>
        </PressableScale>
        <PressableScale style={styles.secondary} onPress={onLater}>
          <Text style={styles.secondaryText}>Maybe later</Text>
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
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
