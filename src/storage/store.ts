import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchSettings, DEFAULT_MATCH_SETTINGS } from '@/types';
import { SeenMap, allUnseen } from '@/tour/tourState';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const MATCH_SETTINGS_KEY = 'match_settings';
const COACHMARKS_SEEN_KEY = 'coachmarks_seen';
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

// Reset onboarding so the first-run flow replays on next launch (Reset app).
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

// Whether the feature tour is allowed to show coachmarks. Off by default; turned
// on for the first session after onboarding and by Replay tour, and turned off
// when the tour completes, is skipped, or its session ends — so coachmarks never
// leak into ordinary later sessions.
export async function isTourEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TOUR_ENABLED_KEY);
  return value === 'true';
}

export async function setTourEnabled(enabled: boolean): Promise<void> {
  if (enabled) await AsyncStorage.setItem(TOUR_ENABLED_KEY, 'true');
  else await AsyncStorage.removeItem(TOUR_ENABLED_KEY);
}

// Which feature-tour coachmarks have been seen (persisted individually so the
// tour survives session resume mid-tour). Unknown keys default to unseen, so
// adding a coachmark later doesn't read as already-seen.
export async function getCoachmarksSeen(): Promise<SeenMap> {
  const raw = await AsyncStorage.getItem(COACHMARKS_SEEN_KEY);
  if (!raw) return allUnseen();
  try {
    return { ...allUnseen(), ...JSON.parse(raw) };
  } catch {
    return allUnseen();
  }
}

export async function saveCoachmarksSeen(seen: SeenMap): Promise<void> {
  await AsyncStorage.setItem(COACHMARKS_SEEN_KEY, JSON.stringify(seen));
}

// Reset all coachmarks to unseen (Replay tour / Reset app).
export async function clearCoachmarksSeen(): Promise<void> {
  await AsyncStorage.removeItem(COACHMARKS_SEEN_KEY);
}
