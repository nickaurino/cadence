import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';

interface HoldToEndProps {
  onEnd: () => void; // fired once when the hold completes
  label?: string; // default "Hold to end session"
  duration?: number; // ms, default 1500
}

const CANCEL_DURATION = 200;
// Pause at 100% before firing onEnd: the success buzz lands while the bar is
// visibly full, so completion reads as an event instead of a cut-off.
const COMPLETE_HOLD_MS = 150;
const EDGE_WIDTH = 3;

// Fire haptics safely: no-op if the native module isn't in the build yet (the
// JS package is installed, but the buzz only works after a native rebuild).
function haptic(run: () => Promise<unknown>) {
  try {
    run().catch(() => {});
  } catch {
    /* native haptics module not present */
  }
}

// A press-and-hold confirm. A gold bar with a bright leading edge sweeps the
// full pill while the pill glows accent; the fill is driven on the native UI
// thread (transforms, not width) so it renders every frame and visibly reaches
// 100% before the session ends. Release early cancels.
export function HoldToEnd({
  onEnd,
  label = 'Hold to end session',
  duration = 1500,
}: HoldToEndProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const firedRef = useRef(false);
  const [held, setHeld] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  const onComplete = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(onEnd, COMPLETE_HOLD_MS);
  };

  const handlePressIn = () => {
    // A new hold is a fresh attempt: if a previous fire's onEnd never navigated
    // away (error path), the button must not be permanently dead.
    firedRef.current = false;
    setHeld(true);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    // Linear, native-driven, and completed via the animation callback: the JS
    // thread can stall near the end of a session, and a JS-driven width fill
    // visibly stopped short of 100% before the screen changed.
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onComplete();
    });
  };

  const handlePressOut = () => {
    setHeld(false);
    if (firedRef.current) return;
    progress.stopAnimation(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: CANCEL_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  // Left-anchored fill via transforms (native driver can't animate width):
  // scaleX scales about the center, so a matching translateX of
  // (scale - 1) * width / 2 keeps the left edge pinned to the pill's start.
  const fillTransform = [
    {
      translateX: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-barWidth / 2, 0],
      }),
    },
    { scaleX: progress },
  ];
  // The bright leading edge rides the fill's front (right edge at progress * width).
  const edgeTransform = [
    {
      translateX: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, barWidth],
      }),
    },
  ];

  return (
    // The glow lives on this wrapper: the pill clips its fill (overflow hidden),
    // and on iOS masksToBounds also clips the view's OWN shadow, so a glow set
    // on the pill itself would never render.
    <View style={[styles.glowWrap, held && styles.glowWrapHeld]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={[styles.pill, held && styles.pillHeld]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, { width: barWidth, transform: fillTransform }]}
        />
        {held && (
          <Animated.View pointerEvents="none" style={[styles.edge, { transform: edgeTransform }]} />
        )}
        <Text style={[styles.label, held && styles.labelHeld]} numberOfLines={1}>
          {held ? 'Release to cancel' : label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Opaque rounded base so iOS has a shape to cast the held glow from.
  glowWrap: { borderRadius: 27, backgroundColor: colors.background },
  // While held the pill glows accent, same treatment as the Start ring.
  glowWrapHeld: {
    shadowColor: colors.accent,
    shadowRadius: 14,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  pill: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pillHeld: { borderColor: colors.accent, backgroundColor: colors.surface },
  // Clipped to the rounded pill by overflow. Static glow (the shadow bleeds
  // gold into the unfilled side); only transforms animate, on the native driver.
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowRadius: 10,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
  },
  // Hot, near-white leading edge: the "live wire" front of the fill.
  edge: {
    position: 'absolute',
    left: -EDGE_WIDTH,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    backgroundColor: colors.text, // cream
    shadowColor: colors.text,
    shadowRadius: 6,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  labelHeld: { color: colors.text },
});

export default HoldToEnd;
