import { View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  position: number; // seconds into the track
  duration: number | null; // total seconds, null until loaded
}

// Minimal display-only playback bar: a faint track with a Marigold fill.
// Not scrubbable — the system Music player can't be reliably seeked.
export function ProgressBar({ position, duration }: Props) {
  const ratio = duration && duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingVertical: 8 },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.accent },
});
