import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

interface CadenceRingProps {
  value: number | string; // the hero number to show (already chosen by the parent)
  unit?: string; // e.g. "steps / min"; default "steps / min"
  active: boolean; // true = in the pocket — drives the pulse
  closeness?: number; // 0..1 warmth; default: active ? 1 : 0
}

const RING_SIZE = 220;
const PULSE_DURATION = 1200; // half a ~2.4s cycle
const WARM_DURATION = 320;

export function CadenceRing({ value, unit = 'steps / min', active, closeness }: CadenceRingProps) {
  const targetCloseness = closeness ?? (active ? 1 : 0);

  // Drives the gentle in-the-pocket pulse (scale). Native-driver only.
  const pulse = useRef(new Animated.Value(0)).current;
  // Drives the cold->gold warmth (colors + glow). Color/shadow interpolation
  // requires useNativeDriver: false, so this stays a separate value.
  const warm = useRef(new Animated.Value(targetCloseness)).current;

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

  useEffect(() => {
    Animated.timing(warm, {
      toValue: targetCloseness,
      duration: WARM_DURATION,
      useNativeDriver: false,
    }).start();
  }, [targetCloseness, warm]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });
  const borderColor = warm.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });
  const shadowOpacity = warm.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });
  const numberColor = warm.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text, colors.accent],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          borderColor,
          shadowColor: colors.accent,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.disc}>
        <Animated.Text
          style={[styles.value, { color: numberColor }]}
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
