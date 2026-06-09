import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

interface CadenceRingProps {
  value: number | string; // the hero number to show (already chosen by the parent)
  unit?: string; // e.g. "steps / min"; default "steps / min"
  active: boolean; // true = in the pocket (gold, pulsing); false = shifting/finding (calm)
}

const RING_SIZE = 220;
const PULSE_DURATION = 1200; // half a ~2.4s cycle

export function CadenceRing({ value, unit = 'steps / min', active }: CadenceRingProps) {
  // Drives the gentle in-the-pocket pulse (scale + glow). Native-driver safe.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      Animated.timing(pulse, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [active, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          borderColor: active ? colors.accent : colors.border,
          transform: [{ scale }],
        },
        active && styles.glow,
        active && { shadowOpacity: glowOpacity },
      ]}
    >
      <View style={styles.disc}>
        <Animated.Text
          style={[styles.value, { color: active ? colors.accent : colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Animated.Text>
        <Animated.Text style={styles.unit} numberOfLines={1}>
          {unit}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowColor: colors.accent,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  disc: {
    flex: 1,
    alignSelf: 'stretch',
    margin: 6,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 64,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  unit: {
    marginTop: 6,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
});
