import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  onDismiss?: () => void; // tap "Got it" to advance this step
  onSkip?: () => void; // "Skip tour" bails out of the whole tour
  // The dark panels BLOCK touches by default, so during the tour only the spotlit
  // target (and the overlay's own buttons) are pressable. Pass true to let
  // touches through for purely informational overlays. This overlay does not
  // animate (one animation driver per view; see CadenceRing/PressableScale).
  passthrough?: boolean;
  // Force the copy card above/below the target; default picks by position.
  cardPosition?: 'above' | 'below';
  // Whether to render the copy card. Defaults to true; the tour passes false
  // during the brief unmeasured window so a center-parked card never flashes.
  cardVisible?: boolean;
}

// Ported from hobby-randomizer's spotlight: a 4-panel dark cutout around a
// measured element plus a floating copy card. No SVG, no new dependencies.
export function SpotlightOverlay({ targetRect, copy, onDismiss, onSkip, passthrough = false, cardPosition, cardVisible = true }: Props) {
  const insets = useSafeAreaInsets();
  const cardBelow = cardPosition
    ? cardPosition === 'below'
    : !targetRect || targetRect.y < SCREEN_H * 0.45;
  const cardStyle = targetRect
    ? cardBelow
      ? { top: targetRect.y + targetRect.height + PAD + 16 }
      : { bottom: SCREEN_H - targetRect.y + PAD + 36 }
    : { top: SCREEN_H * 0.3 };

  const panelPE = passthrough ? 'none' : undefined;

  return (
    // zIndex above SettingsButton (20): RN zIndex reorders sibling hit-testing,
    // so without this the gear floats over the panels and stays tappable.
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="box-none">
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

      {cardVisible && copy ? (
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
        <PressableScale style={[styles.skip, { top: insets.top + 10 }]} onPress={onSkip}>
          <Text style={styles.skipText}>Skip tour</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Above SettingsButton's zIndex 20 so the panels actually block it.
  root: { zIndex: 30, elevation: 30 },
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
  // Top-left so it never sits over the Settings gear (top-right); `top` comes
  // from the safe-area inset at render time.
  skip: {
    position: 'absolute',
    left: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
