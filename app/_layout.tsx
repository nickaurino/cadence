import { Slot } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

export default function RootLayout() {
  // initialMetrics makes safe-area insets known synchronously at mount, so screens
  // don't render at the wrong offset for one frame and then shift down ~1px.
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Slot />
    </SafeAreaProvider>
  );
}
