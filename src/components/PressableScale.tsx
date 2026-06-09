import { type ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// IMPORTANT: the style goes on the Pressable itself (via an animated Pressable),
// not a wrapper — otherwise flex/width layout collapses (segments shrink, full-
// width CTAs become content-sized). The scale is JS-driven (useNativeDriver:false)
// so it never emits the "onAnimatedValueUpdate with no listeners" warning that a
// native-driven value does; the press scale is tiny, so JS is plenty smooth.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  disabled?: boolean;
  scaleTo?: number; // how far it shrinks on press (default 0.98 — subtle)
}

export function PressableScale({
  children,
  onPress,
  style,
  hitSlop,
  disabled,
  scaleTo = 0.98,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      hitSlop={hitSlop}
      disabled={disabled}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
