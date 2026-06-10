jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  savePersisted,
  loadPersisted,
  clearPersisted,
  shouldResume,
  RESUME_MAX_AGE_MS,
  type PersistedSession,
} from '@/storage/session-store';

const KEY = 'session:active';

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    version: 1,
    vibe: 'hype',
    startedAt: 1000,
    tracks: [
      { id: 't1', name: 'Song', artist: 'Artist', albumArtUrl: '', tempo: 180 },
    ],
    index: 0,
    page: 0,
    settings: {
      exact: true,
      halfTime: true,
      doubleTime: true,
      tolerance: 0.06,
      sensitivity: 'balanced',
      songSwitching: 'boundary',
    },
    paceLocked: false,
    managedCadence: 0,
    cadenceSum: 0,
    cadenceCount: 0,
    playedIds: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('savePersisted', () => {
  it('writes the JSON string under the active session key, stamped with savedAt', async () => {
    const session = makeSession();
    await savePersisted(session);
    const [key, raw] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(key).toBe(KEY);
    const written = JSON.parse(raw);
    expect(typeof written.savedAt).toBe('number');
    expect({ ...written, savedAt: undefined }).toEqual({ ...session, savedAt: undefined });
  });
});

describe('loadPersisted', () => {
  it('returns the parsed object for a valid stored value', async () => {
    const session = makeSession();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(session));
    await expect(loadPersisted()).resolves.toEqual(session);
  });

  it('returns null when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(loadPersisted()).resolves.toBeNull();
  });

  it('returns null on corrupt JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not json{');
    await expect(loadPersisted()).resolves.toBeNull();
  });

  it('returns null on a version mismatch', async () => {
    const stale = JSON.stringify({ ...makeSession(), version: 0 });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stale);
    await expect(loadPersisted()).resolves.toBeNull();
  });

  it('returns null for a versioned-but-malformed snapshot (truncated write)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ version: 1 }));
    await expect(loadPersisted()).resolves.toBeNull();
  });

  it('returns null when tracks is not an array', async () => {
    const bad = JSON.stringify({ ...makeSession(), tracks: 'oops' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(bad);
    await expect(loadPersisted()).resolves.toBeNull();
  });
});

describe('clearPersisted', () => {
  it('removes the active session key', async () => {
    await clearPersisted();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY);
  });
});

describe('shouldResume', () => {
  const now = 100_000_000;

  it('is true for a freshly-saved snapshot', () => {
    expect(shouldResume(makeSession({ savedAt: now - 1000 }), now)).toBe(true);
  });

  it('is false for null', () => {
    expect(shouldResume(null, now)).toBe(false);
  });

  it('staleness keys off savedAt, not startedAt: a long run backgrounded briefly resumes', () => {
    const longRun = makeSession({ startedAt: now - RESUME_MAX_AGE_MS - 1, savedAt: now - 30_000 });
    expect(shouldResume(longRun, now)).toBe(true);
  });

  it('is false when the snapshot was saved longer ago than the max age', () => {
    const stale = makeSession({ startedAt: now - 1000, savedAt: now - RESUME_MAX_AGE_MS - 1 });
    expect(shouldResume(stale, now)).toBe(false);
  });

  it('falls back to startedAt for snapshots without savedAt (forward-compat)', () => {
    expect(shouldResume(makeSession({ startedAt: now - 1000 }), now)).toBe(true);
    expect(shouldResume(makeSession({ startedAt: now - RESUME_MAX_AGE_MS - 1 }), now)).toBe(false);
  });

  it('is false for a future timestamp (clock change guard)', () => {
    expect(shouldResume(makeSession({ savedAt: now + 1000 }), now)).toBe(false);
  });
});
