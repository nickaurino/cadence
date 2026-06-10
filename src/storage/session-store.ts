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
  // Steps recorded so far (so a resume doesn't lose pre-kill steps). Optional
  // for forward-compat with older snapshots.
  steps?: number;
  // Stamped by savePersisted. Staleness keys off this, not startedAt: a long
  // run backgrounded for 30s should resume; a short run whose phone died hours
  // ago should not.
  savedAt?: number;
}

const KEY = 'session:active';
const CURRENT_VERSION = 1;
// Auto-resume only if the snapshot was SAVED within this window. Older
// snapshots are treated as abandoned (you won't resume a run from yesterday).
export const RESUME_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function savePersisted(s: PersistedSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
}

// A version match alone isn't enough: a truncated/corrupted write can still be
// valid JSON ({"version":1}), and resuming it would crash the engine on the
// first track change. Validate the fields resumeFrom actually dereferences.
function isValidSnapshot(s: PersistedSession): boolean {
  return (
    Array.isArray(s.tracks) &&
    typeof s.index === 'number' &&
    typeof s.page === 'number' &&
    typeof s.startedAt === 'number' &&
    typeof s.managedCadence === 'number' &&
    typeof s.cadenceSum === 'number' &&
    typeof s.cadenceCount === 'number' &&
    typeof s.paceLocked === 'boolean' &&
    Array.isArray(s.playedIds) &&
    typeof s.vibe === 'string' &&
    s.settings != null &&
    typeof s.settings === 'object'
  );
}

export async function loadPersisted(): Promise<PersistedSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed.version !== CURRENT_VERSION) return null;
    if (!isValidSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPersisted(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// Pure predicate. Resume only a non-null snapshot saved in the recent past —
// guarding against future timestamps from clock changes. Falls back to
// startedAt for older snapshots that predate savedAt.
export function shouldResume(s: PersistedSession | null, now: number): boolean {
  if (!s) return false;
  const stamp = s.savedAt ?? s.startedAt;
  if (stamp > now) return false;
  return now - stamp <= RESUME_MAX_AGE_MS;
}
