import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  markOnboardingComplete,
  hasCompletedOnboarding,
  getMatchSettings,
  saveMatchSettings,
  resetOnboarding,
  isTourEnabled,
  setTourEnabled,
} from '@/storage/store';
import { DEFAULT_MATCH_SETTINGS } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => AsyncStorage.clear());

test('marks onboarding complete', async () => {
  expect(await hasCompletedOnboarding()).toBe(false);
  await markOnboardingComplete();
  expect(await hasCompletedOnboarding()).toBe(true);
});

test('returns default match settings when none saved', async () => {
  expect(await getMatchSettings()).toEqual(DEFAULT_MATCH_SETTINGS);
});

test('saves and reloads match settings', async () => {
  await saveMatchSettings({ ...DEFAULT_MATCH_SETTINGS, halfTime: false, sensitivity: 'relaxed' });
  const loaded = await getMatchSettings();
  expect(loaded.halfTime).toBe(false);
  expect(loaded.sensitivity).toBe('relaxed');
});

test('fills missing fields from defaults (forward-compatible)', async () => {
  await AsyncStorage.setItem('match_settings', JSON.stringify({ exact: false }));
  const loaded = await getMatchSettings();
  expect(loaded.exact).toBe(false);
  expect(loaded.doubleTime).toBe(DEFAULT_MATCH_SETTINGS.doubleTime); // backfilled
});

test('tour enabled flag defaults off, persists, and clears', async () => {
  expect(await isTourEnabled()).toBe(false);
  await setTourEnabled(true);
  expect(await isTourEnabled()).toBe(true);
  await setTourEnabled(false);
  expect(await isTourEnabled()).toBe(false);
});

test('resetOnboarding makes onboarding incomplete again', async () => {
  await markOnboardingComplete();
  expect(await hasCompletedOnboarding()).toBe(true);
  await resetOnboarding();
  expect(await hasCompletedOnboarding()).toBe(false);
});
