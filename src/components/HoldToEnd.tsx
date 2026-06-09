import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';

interface HoldToEndProps {
  onEnd: () => void; // fired once when the hold completes
  label?: string; // default "Hold to end session"
  duration?: number; // ms, default 1500
}

const CANCEL_DURATION = 200;

// Fire haptics safely: no-op if the native module isn't in the build yet (the
// JS package is installed, but the buzz only works after a native rebuild).
function haptic(run: () => Promise<unknown>) {
  try {
    run().catch(() => {});
  } catch {
    /* native haptics module not present */
  }
}

// A press-and-hold confirm. A gold bar sweeps the full length as you hold; a light
// tick on engage and a success buzz on completion make finishing feel deliberate
// and earned. Release early cancels.
export function HoldToEnd({
  onEnd,
  label = 'Hold to end session',
  duration = 1500,
}: HoldToEndProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearHoldTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const onComplete = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    onEnd();
  };

  const handlePressIn = () => {
    setHeld(true);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();
    clearHoldTimeout();
    timeoutRef.current = setTimeout(onComplete, duration);
  };

  const handlePressOut = () => {
    setHeld(false);
    clearHoldTimeout();
    if (firedRef.current) return;
    progress.stopAnimation(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: CANCEL_DURATION,
        useNativeDriver: false,
      }).start();
    });
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.pill, held && styles.pillHeld]}
    >
      <Animated.View pointerEvents="none" style={[styles.fill, { width: fillWidth }]} />
      <Text style={[styles.label, held && styles.labelHeld]} numberOfLines={1}>
        {held ? 'Release to cancel' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  pillHeld: { borderColor: colors.accent },
  // Sweeps the full length of the pill (clipped to the rounded shape by overflow).
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  labelHeld: { color: colors.text },
});

export default HoldToEnd;
