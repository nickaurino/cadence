import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchSettings, DEFAULT_MATCH_SETTINGS } from '@/types';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const MATCH_SETTINGS_KEY = 'match_settings';
const TOUR_ENABLED_KEY = 'tour_enabled';

export async function getMatchSettings(): Promise<MatchSettings> {
  const raw = await AsyncStorage.getItem(MATCH_SETTINGS_KEY);
  if (!raw) return DEFAULT_MATCH_SETTINGS;
  try {
    return { ...DEFAULT_MATCH_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MATCH_SETTINGS;
  }
}

export async function saveMatchSettings(settings: MatchSettings): Promise<void> {
  await AsyncStorage.setItem(MATCH_SETTINGS_KEY, JSON.stringify(settings));
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

// Reset onboarding so the first-run flow replays (Settings -> Restart onboarding).
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

// Whether the guided feature tour is pending (should run from the home screen).
// Off by default; turned on when onboarding completes, and
// turned off when the tour finishes or is skipped. Persisted so a kill mid-tour
// restarts it from the top.
export async function isTourEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TOUR_ENABLED_KEY);
  return value === 'true';
}

export async function setTourEnabled(enabled: boolean): Promise<void> {
  if (enabled) await AsyncStorage.setItem(TOUR_ENABLED_KEY, 'true');
  else await AsyncStorage.removeItem(TOUR_ENABLED_KEY);
}
