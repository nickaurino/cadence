import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchSettings, DEFAULT_MATCH_SETTINGS } from '@/types';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const MATCH_SETTINGS_KEY = 'match_settings';

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
