import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibe, MatchSettings, MusicTrack } from '@/types';

export interface PersistedSession {
  version: 1;
  vibe: Vibe;
  startedAt: number;
  tracks: MusicTrack[];
  index: number;
  page: number;
  settings: MatchSettings;
  paceLocked: boolean;
  managedCadence: number;
  cadenceSum: number;
  cadenceCount: number;
  playedIds: string[];
}

const KEY = 'session:active';
const CURRENT_VERSION = 1;
// Auto-resume only if the session began within this window. Older snapshots are
// treated as abandoned (you won't resume a run from yesterday).
export const RESUME_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function savePersisted(s: PersistedSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function loadPersisted(): Promise<PersistedSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPersisted(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// Pure predicate. Resume only a non-null snapshot that started in the recent
// past — guarding against future timestamps from clock changes.
export function shouldResume(s: PersistedSession | null, now: number): boolean {
  if (!s) return false;
  if (s.startedAt > now) return false;
  return now - s.startedAt <= RESUME_MAX_AGE_MS;
}
