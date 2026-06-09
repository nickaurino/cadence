import { Slot } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { TourProvider } from '@/tour/TourContext';

export default function RootLayout() {
  // initialMetrics makes safe-area insets known synchronously at mount, so screens
  // don't render at the wrong offset for one frame and then shift down ~1px.
  // TourProvider wraps the app so the active screen can show coachmarks and
  // Settings can replay the tour (via the module-level shim).
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <TourProvider>
        <Slot />
      </TourProvider>
    </SafeAreaProvider>
  );
}
