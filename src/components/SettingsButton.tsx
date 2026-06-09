import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

// The settings gear, in the EXACT same spot on every screen. Positioned from the
// true safe-area top (not a hardcoded offset), with a generous tap target and a
// high z-index so it's reliably accessible on the very first frame.
export function SettingsButton() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      hitSlop={16}
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [
        styles.btn,
        { top: insets.top + 6 },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name="gearshape.fill" size={24} type="monochrome" tintColor={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { position: 'absolute', right: 10, padding: 10, zIndex: 20 },
  pressed: { opacity: 0.55 },
});
