import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/colors';

interface Props {
  onOpenSettings: () => void;
  onSetPace: () => void;
}

// Shown on the active screen when motion is unavailable (denied/revoked/
// unsupported) so it never spins forever in "Finding your pace". Two recoverable
// paths: enable Motion in iOS Settings, or set your own pace (manual pace runs
// without the pedometer). See CONTEXT.md "No-motion state".
export function NoMotionState({ onOpenSettings, onSetPace }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadence can't read your steps</Text>
      <Text style={styles.body}>
        Turn on Motion access to match music to your pace automatically, or set your
        own pace to get going now.
      </Text>
      <PressableScale style={styles.primary} onPress={onOpenSettings}>
        <Text style={styles.primaryText}>Open Settings</Text>
      </PressableScale>
      <PressableScale style={styles.secondary} onPress={onSetPace}>
        <Text style={styles.secondaryText}>Set my pace manually</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 36 },
  primary: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
  secondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 50, paddingVertical: 15, alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
