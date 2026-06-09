import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/colors';

const { height: SCREEN_H } = Dimensions.get('window');
const DARK = 'rgba(0,0,0,0.82)'; // reads as Onyx
const PAD = 5;

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  // Spotlight rect in the overlay's own coordinate space (already adjusted for
  // safe-area offset). null = full dark overlay with no cutout.
  targetRect: TargetRect | null;
  copy?: string;
  onDismiss?: () => void; // tap "Got it" to dismiss this coachmark
  onSkip?: () => void; // "Skip tour" — marks all remaining seen
  // When true the panels let touches pass through so the run isn't blocked
  // (informational coachmarks). One animation driver per view; this overlay does
  // not animate, to stay safe alongside CadenceRing/PressableScale.
  passthrough?: boolean;
}

// Ported from hobby-randomizer's spotlight: a 4-panel dark cutout around a
// measured element plus a floating copy card. No SVG, no new dependencies.
export function SpotlightOverlay({ targetRect, copy, onDismiss, onSkip, passthrough = false }: Props) {
  const cardBelow = !targetRect || targetRect.y < SCREEN_H * 0.45;
  const cardStyle = targetRect
    ? cardBelow
      ? { top: targetRect.y + targetRect.height + PAD + 16 }
      : { bottom: SCREEN_H - targetRect.y + PAD + 36 }
    : { top: SCREEN_H * 0.3 };

  const panelPE = passthrough ? 'none' : undefined;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {targetRect ? (
        <>
          <View pointerEvents={panelPE} style={[styles.panel, { top: 0, left: 0, right: 0, height: Math.max(0, targetRect.y - PAD) }]} />
          <View pointerEvents={panelPE} style={[styles.panel, { top: targetRect.y + targetRect.height + PAD, left: 0, right: 0, bottom: 0 }]} />
          <View pointerEvents={panelPE} style={[styles.panel, { top: targetRect.y - PAD, left: 0, width: Math.max(0, targetRect.x - PAD), height: targetRect.height + PAD * 2 }]} />
          <View pointerEvents={panelPE} style={[styles.panel, { top: targetRect.y - PAD, left: targetRect.x + targetRect.width + PAD, right: 0, height: targetRect.height + PAD * 2 }]} />
        </>
      ) : (
        <View pointerEvents={panelPE} style={[styles.panel, StyleSheet.absoluteFill]} />
      )}

      {targetRect && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: targetRect.y - PAD,
            left: targetRect.x - PAD,
            width: targetRect.width + PAD * 2,
            height: targetRect.height + PAD * 2,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.accent,
          }}
        />
      )}

      {copy ? (
        <View style={[styles.card, cardStyle]}>
          <Text style={styles.copy}>{copy}</Text>
          {onDismiss && (
            <PressableScale style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>Got it</Text>
            </PressableScale>
          )}
        </View>
      ) : null}

      {onSkip && (
        <PressableScale style={styles.skip} onPress={onSkip}>
          <Text style={styles.skipText}>Skip tour</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', backgroundColor: DARK },
  card: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  copy: { color: colors.text, fontSize: 16, lineHeight: 24 },
  dismissBtn: { alignSelf: 'flex-end', backgroundColor: colors.accent, paddingVertical: 9, paddingHorizontal: 20, borderRadius: 12 },
  dismissText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
  skip: {
    position: 'absolute',
    top: 56,
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
