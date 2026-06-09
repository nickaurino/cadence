import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface HoldToEndProps {
  onEnd: () => void; // fired once when the hold completes
  label?: string; // default "Hold to end session"
  duration?: number; // ms, default 1500
}

const CANCEL_DURATION = 200;

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
    onEnd();
  };

  const handlePressIn = () => {
    setHeld(true);
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
      style={styles.pill}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { width: fillWidth }]}
      />
      <Text
        style={[styles.label, held && styles.labelHeld]}
        numberOfLines={1}
      >
        {held ? 'Release to cancel' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accentDim,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  labelHeld: {
    color: colors.text,
  },
});

export default HoldToEnd;
