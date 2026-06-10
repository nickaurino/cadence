import { SessionEngine } from '@/engine/session';
import { Vibe } from '@/types';

// Captures the engine's perceived-cadence callback (now a plain spm number).
const mockHolder: { cb: ((spm: number) => void) | null } = { cb: null };
// Captures the native track-change callback (auto-advance / boundary swap).
const mockTrackHolder: { cb: ((e: { trackId: string; title: string }) => void) | null } = {
  cb: null,
};

jest.mock('@/sensors/cadence', () => ({
  CadenceDetector: jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    start: jest.fn((cb) => {
      mockHolder.cb = cb;
    }),
    stop: jest.fn(),
    recalibrate: jest.fn(),
    totalSteps: jest.fn().mockReturnValue(820),
    seedStepsBase: jest.fn(),
    seedFromHistory: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/storage/store', () => ({
  getMatchSettings: jest.fn().mockResolvedValue({
    exact: true,
    halfTime: true,
    doubleTime: true,
    tolerance: 0.06,
    sensitivity: 'responsive', // threshold 10, sustain 8000ms
    songSwitching: 'immediate',
  }),
}));

jest.mock('@/music/api', () => ({
  getRecommendations: jest.fn().mockResolvedValue([
    { id: 't1', name: 'Song A', artist: 'A', albumArtUrl: '', tempo: 170 },
    { id: 't2', name: 'Song B', artist: 'B', albumArtUrl: '', tempo: 172 },
  ]),
}));

jest.mock('@/music/player', () => ({
  playQueue: jest.fn().mockResolvedValue(undefined),
  queueTrack: jest.fn().mockResolvedValue(undefined),
  skipToNext: jest.fn().mockResolvedValue(undefined),
  skipToPrevious: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  addTrackChangeListener: jest.fn((cb) => {
    mockTrackHolder.cb = cb;
    return { remove: jest.fn() };
  }),
  getPlaybackStatus: jest.fn().mockResolvedValue({ position: 0, duration: null, isPlaying: true }),
  disconnect: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/storage/session-store', () => ({
  savePersisted: jest.fn().mockResolvedValue(undefined),
  clearPersisted: jest.fn().mockResolvedValue(undefined),
}));

import {
  playQueue,
  queueTrack,
  skipToNext,
  skipToPrevious,
  pause,
  resume,
  addTrackChangeListener,
} from '@/music/player';
import { getRecommendations } from '@/music/api';
import { getMatchSettings } from '@/storage/store';
import { savePersisted, clearPersisted, PersistedSession } from '@/storage/session-store';
import { MatchSettings, MusicTrack } from '@/types';

const flush = async () => {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
};

beforeEach(() => {
  jest.clearAllMocks();
  (getMatchSettings as jest.Mock).mockResolvedValue({
    exact: true,
    halfTime: true,
    doubleTime: true,
    tolerance: 0.06,
    sensitivity: 'responsive',
    songSwitching: 'immediate',
  });
  mockHolder.cb = null;
  mockTrackHolder.cb = null;
});

async function startAndMove(): Promise<SessionEngine> {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });
  mockHolder.cb!(170);
  await flush();
  return engine;
}

test('start waits for movement — no song plays yet', async () => {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });

  expect(getRecommendations).not.toHaveBeenCalled();
  expect(playQueue).not.toHaveBeenCalled();
  expect(engine.getState().isCalibrating).toBe(true);
});

test('first perceived reading locks managed cadence and plays', async () => {
  const engine = await startAndMove();

  expect(getRecommendations).toHaveBeenCalledWith(expect.objectContaining({ targetBpm: 170 }));
  expect(playQueue).toHaveBeenCalledWith(['t1', 't2']);
  expect(engine.getState().isCalibrating).toBe(false);
  expect(engine.getState().managedCadence).toBe(170);
  expect(engine.getState().perceivedCadence).toBe(170);
});

test('managed cadence follows perceived only after sustained drift', async () => {
  let t = 1000;
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => t);
  const engine = await startAndMove(); // managed 170
  (getRecommendations as jest.Mock).mockClear();

  mockHolder.cb!(185); // drift 15 >= 10; timer starts
  await flush();
  expect(getRecommendations).not.toHaveBeenCalled(); // not sustained yet

  t = 1000 + 9000; // past the 8s responsive sustain
  mockHolder.cb!(185);
  await flush();

  expect(getRecommendations).toHaveBeenCalledWith(expect.objectContaining({ targetBpm: 185 }));
  expect(engine.getState().managedCadence).toBe(185);
  nowSpy.mockRestore();
});

test('boundary switching queues new songs for the next track end', async () => {
  (getMatchSettings as jest.Mock).mockResolvedValue({
    exact: true,
    halfTime: true,
    doubleTime: true,
    tolerance: 0.06,
    sensitivity: 'responsive',
    songSwitching: 'boundary',
  });
  let t = 1000;
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => t);

  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });
  mockHolder.cb!(170);
  await flush(); // first lock plays [t1, t2]
  (playQueue as jest.Mock).mockClear();
  (getRecommendations as jest.Mock).mockResolvedValueOnce([
    { id: 'n1', name: 'N1', artist: '', albumArtUrl: '', tempo: 170 },
    { id: 'n2', name: 'N2', artist: '', albumArtUrl: '', tempo: 170 },
  ]);

  mockHolder.cb!(185);
  await flush();
  t = 1000 + 9000;
  mockHolder.cb!(185);
  await flush(); // boundary commit -> pending, no swap yet

  expect(playQueue).not.toHaveBeenCalled();
  expect(engine.getState().notice).toContain('Pace changed');

  mockTrackHolder.cb!({ trackId: 't2', title: '' }); // current song ends
  await flush();

  expect(playQueue).toHaveBeenCalledWith(['n1', 'n2']);
  nowSpy.mockRestore();
});

test('locked pace ignores perceived changes', async () => {
  const engine = await startAndMove();
  engine.setPaceLocked(true);
  (getRecommendations as jest.Mock).mockClear();

  mockHolder.cb!(150);
  await flush();

  expect(getRecommendations).not.toHaveBeenCalled();
  expect(engine.getState().managedCadence).toBe(170);
});

test('setManualPace fetches for the chosen cadence and locks', async () => {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });

  await engine.setManualPace(178);

  expect(getRecommendations).toHaveBeenCalledWith(expect.objectContaining({ targetBpm: 178 }));
  expect(engine.getState().paceLocked).toBe(true);
  expect(engine.getState().managedCadence).toBe(178);
});

test('flags an impossibly high cadence without re-managing', async () => {
  const engine = await startAndMove();
  (getRecommendations as jest.Mock).mockClear();

  mockHolder.cb!(250);
  await flush();

  expect(getRecommendations).not.toHaveBeenCalled();
  expect(engine.getState().managedCadence).toBe(170);
  expect(engine.getState().notice).toContain('250');
});

test('a too-low / zero reading changes nothing, silently', async () => {
  const engine = await startAndMove();
  (getRecommendations as jest.Mock).mockClear();

  mockHolder.cb!(40);
  await flush();
  mockHolder.cb!(0);
  await flush();

  expect(getRecommendations).not.toHaveBeenCalled();
  expect(engine.getState().managedCadence).toBe(170);
  expect(engine.getState().notice).toBeNull();
});

test('skipNext advances the track via the native player', async () => {
  const engine = await startAndMove();

  await engine.skipNext();

  expect(skipToNext).toHaveBeenCalled();
  expect(engine.getState().currentTrack?.id).toBe('t2');
});

test('skipPrevious goes back a track', async () => {
  const engine = await startAndMove();
  await engine.skipNext();

  await engine.skipPrevious();

  expect(skipToPrevious).toHaveBeenCalled();
  expect(engine.getState().currentTrack?.id).toBe('t1');
});

test('native auto-advance updates the current track', async () => {
  const engine = await startAndMove();

  mockTrackHolder.cb!({ trackId: 't2', title: 'Song B' });

  expect(engine.getState().currentTrack?.id).toBe('t2');
});

test('replenishes the queue with fresh songs when it runs low', async () => {
  (getRecommendations as jest.Mock)
    .mockResolvedValueOnce([
      { id: 't1', name: 'A', artist: 'A', albumArtUrl: '', tempo: 170 },
      { id: 't2', name: 'B', artist: 'B', albumArtUrl: '', tempo: 172 },
    ])
    .mockResolvedValueOnce([
      { id: 't3', name: 'C', artist: 'C', albumArtUrl: '', tempo: 171 },
      { id: 't2', name: 'B', artist: 'B', albumArtUrl: '', tempo: 172 }, // dup, filtered
    ]);

  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });
  mockHolder.cb!(170);
  await flush();

  await engine.skipNext(); // reaches the end -> replenish
  await flush();

  expect(getRecommendations).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  expect(queueTrack).toHaveBeenCalledWith('t3');
  expect(queueTrack).not.toHaveBeenCalledWith('t2');
});

test('getSummary reports session stats', async () => {
  const engine = await startAndMove(); // perceived 170 accumulated, t1 played

  const summary = engine.getSummary();

  expect(summary.avgCadence).toBe(170);
  expect(summary.songsPlayed).toBeGreaterThanOrEqual(1);
  expect(summary.steps).toBe(820);
  expect(summary.distanceMi).toBe(0.4); // 820 * 0.78 / 1609.34
  expect(summary.durationSec).toBeGreaterThanOrEqual(0);
});

test('inThePocket is false while calibrating', async () => {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });

  expect(engine.getState().isCalibrating).toBe(true);
  expect(engine.getState().inThePocket).toBe(false);
});

test('inThePocket is true on first lock and a steady near-managed reading', async () => {
  const engine = await startAndMove(); // managed 170, drift 0

  expect(engine.getState().inThePocket).toBe(true);

  mockHolder.cb!(175); // drift 5 < threshold 10
  await flush();
  expect(engine.getState().inThePocket).toBe(true);
});

test('inThePocket is false when a single reading drifts past the threshold', async () => {
  const engine = await startAndMove(); // managed 170

  mockHolder.cb!(190); // drift 20 >= threshold 10, managed hasn't moved yet
  await flush();

  expect(engine.getState().managedCadence).toBe(170);
  expect(engine.getState().inThePocket).toBe(false);
});

test('setManualPace puts the runner in the pocket', async () => {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });

  await engine.setManualPace(180);

  expect(engine.getState().paceLocked).toBe(true);
  expect(engine.getState().inThePocket).toBe(true);
});

test('setPaceLocked toggles inThePocket', async () => {
  const engine = await startAndMove();

  engine.setPaceLocked(true);
  expect(engine.getState().inThePocket).toBe(true);

  engine.setPaceLocked(false);
  expect(engine.getState().inThePocket).toBe(false);
});

test('pocketCloseness is 1 for a steady reading at managed', async () => {
  const engine = await startAndMove(); // managed 170, drift 0

  expect(engine.getState().pocketCloseness).toBe(1);
});

test('pocketCloseness falls off linearly with drift', async () => {
  const engine = await startAndMove(); // managed 170, threshold 10

  // The displayed perceived value is EMA-smoothed, so settle it at 175
  // (drift 5 = half of threshold 10) by repeating the reading.
  for (let i = 0; i < 20; i++) {
    mockHolder.cb!(175);
    await flush();
  }

  expect(engine.getState().perceivedCadence).toBe(175);
  expect(engine.getState().pocketCloseness).toBeCloseTo(0.5);
});

test('pocketCloseness is 0 at or past the threshold', async () => {
  const engine = await startAndMove(); // managed 170, threshold 10

  // Settle the displayed perceived value at 180 (drift 10 >= threshold 10).
  for (let i = 0; i < 20; i++) {
    mockHolder.cb!(180);
    await flush();
  }

  expect(engine.getState().perceivedCadence).toBe(180);
  expect(engine.getState().pocketCloseness).toBe(0);
});

test('pocketCloseness is 0 while calibrating', async () => {
  const engine = new SessionEngine();
  await engine.start({ vibe: 'hype' as Vibe });

  expect(engine.getState().isCalibrating).toBe(true);
  expect(engine.getState().pocketCloseness).toBe(0);
});

test('pocketCloseness is 1 after setPaceLocked(true)', async () => {
  const engine = await startAndMove();

  engine.setPaceLocked(true);
  expect(engine.getState().pocketCloseness).toBe(1);
});

test('togglePlayPause pauses then resumes', async () => {
  const engine = await startAndMove();

  await engine.togglePlayPause();
  expect(pause).toHaveBeenCalled();
  expect(engine.getState().isPlaying).toBe(false);

  await engine.togglePlayPause();
  expect(resume).toHaveBeenCalled();
  expect(engine.getState().isPlaying).toBe(true);
});

const SETTINGS: MatchSettings = {
  exact: true,
  halfTime: true,
  doubleTime: true,
  tolerance: 0.06,
  sensitivity: 'responsive',
  songSwitching: 'immediate',
};

function makeSnapshot(overrides: Partial<PersistedSession> = {}): PersistedSession {
  const tracks: MusicTrack[] = [
    { id: 's1', name: 'S1', artist: 'A', albumArtUrl: '', tempo: 168 },
    { id: 's2', name: 'S2', artist: 'B', albumArtUrl: '', tempo: 170 },
    { id: 's3', name: 'S3', artist: 'C', albumArtUrl: '', tempo: 172 },
  ];
  return {
    version: 1,
    vibe: 'hype' as Vibe,
    startedAt: 1000,
    tracks,
    index: 1,
    page: 0,
    settings: SETTINGS,
    paceLocked: true,
    managedCadence: 178,
    cadenceSum: 510,
    cadenceCount: 3,
    playedIds: ['s1', 's2'],
    ...overrides,
  };
}

test('serialize returns null before start, and a v1 snapshot after', async () => {
  const fresh = new SessionEngine();
  expect(fresh.serialize()).toBeNull();

  const engine = await startAndMove(); // vibe hype, t1+t2, managed 170

  const snap = engine.serialize();
  expect(snap).not.toBeNull();
  expect(snap!.version).toBe(1);
  expect(snap!.vibe).toBe('hype');
  expect(snap!.tracks.map((t) => t.id)).toEqual(['t1', 't2']);
  expect(snap!.index).toBe(0);
  expect(snap!.managedCadence).toBe(170); // driven managed cadence is carried
  expect(snap!.settings).toEqual(
    expect.objectContaining({ sensitivity: 'responsive', songSwitching: 'immediate' }),
  );
  expect(Array.isArray(snap!.playedIds)).toBe(true);
  expect(snap!.playedIds).toContain('t1');
});

test('resumeFrom rehydrates state without refetching or replaying', async () => {
  const engine = new SessionEngine();
  const snap = makeSnapshot();

  await engine.resumeFrom(snap);

  const state = engine.getState();
  expect(state.vibe).toBe('hype');
  expect(state.paceLocked).toBe(true);
  expect(state.isPlaying).toBe(true);
  expect(state.managedCadence).toBe(178); // stored managedCadence, not the avg (170)
  expect(state.currentTrack?.id).toBe('s2'); // index 1

  expect(engine.getQueuedTrackIds()).toEqual(['s3']); // tracks after index

  expect(engine.getSummary().songsPlayed).toBe(2); // restored playedIds (s1, s2)

  // Critically: no refetch, no replay.
  expect(getRecommendations).not.toHaveBeenCalled();
  expect(playQueue).not.toHaveBeenCalled();
});

test('resumeFrom re-attaches the track listener and starts the detector', async () => {
  const engine = new SessionEngine();

  await engine.resumeFrom(makeSnapshot());

  expect(addTrackChangeListener).toHaveBeenCalled();
  expect(mockHolder.cb).not.toBeNull(); // detector.start was given a callback
});

test('resume + unknown current track rebuilds a matched queue (recovery refetch)', async () => {
  const engine = new SessionEngine();
  // Snapshot has s1,s2,s3 and a managed cadence > 0.
  await engine.resumeFrom(makeSnapshot({ paceLocked: false }));
  (getRecommendations as jest.Mock).mockClear();

  // Native emits a track that auto-advanced past our saved queue while backgrounded.
  (engine as any)._onNativeTrackChange('unknown-id');
  await flush();

  expect(getRecommendations).toHaveBeenCalledWith(
    expect.objectContaining({ targetBpm: 178 }),
  );
});

test('resume + known current track realigns index without refetching', async () => {
  const engine = new SessionEngine();
  // Extra tracks so realigning to s2 stays above the replenish threshold,
  // isolating the assertion to recovery (not the unrelated replenish refetch).
  const tracks: MusicTrack[] = [
    { id: 's1', name: 'S1', artist: 'A', albumArtUrl: '', tempo: 168 },
    { id: 's2', name: 'S2', artist: 'B', albumArtUrl: '', tempo: 170 },
    { id: 's3', name: 'S3', artist: 'C', albumArtUrl: '', tempo: 172 },
    { id: 's4', name: 'S4', artist: 'D', albumArtUrl: '', tempo: 173 },
    { id: 's5', name: 'S5', artist: 'E', albumArtUrl: '', tempo: 174 },
  ];
  await engine.resumeFrom(makeSnapshot({ index: 0, paceLocked: false, tracks }));
  (getRecommendations as jest.Mock).mockClear();

  (engine as any)._onNativeTrackChange('s2');
  await flush();

  expect(getRecommendations).not.toHaveBeenCalled();
  expect(engine.getState().currentTrack?.id).toBe('s2');
});

test('non-resume unknown track does not trigger recovery refetch', async () => {
  const engine = await startAndMove();
  (getRecommendations as jest.Mock).mockClear();

  (engine as any)._onNativeTrackChange('unknown-id');
  await flush();

  expect(getRecommendations).not.toHaveBeenCalled();
});

test('stop clears the persisted snapshot', async () => {
  const engine = await startAndMove();

  await engine.stop();

  expect(clearPersisted).toHaveBeenCalled();
});

test('_persist(true) writes once; an immediate non-forced call is throttled', async () => {
  const engine = await startAndMove();
  (savePersisted as jest.Mock).mockClear();

  (engine as any)._persist(true);
  expect(savePersisted).toHaveBeenCalledTimes(1);
  expect(savePersisted).toHaveBeenCalledWith(
    expect.objectContaining({ version: 1, vibe: 'hype' }),
  );

  (engine as any)._persist();
  expect(savePersisted).toHaveBeenCalledTimes(1); // throttled
});

// --- Race-condition regressions (epoch guard) ---

describe('stale-fetch protection', () => {
  test('a slow cadence fetch resolving after setManualPace cannot overwrite the manual queue', async () => {
    let t = 1000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => t);
    const engine = await startAndMove(); // managed 170
    (playQueue as jest.Mock).mockClear();

    // Slow fetch for a cadence drift to 185.
    let resolveSlow!: (tracks: MusicTrack[]) => void;
    (getRecommendations as jest.Mock).mockImplementationOnce(
      () => new Promise((r) => (resolveSlow = r))
    );
    mockHolder.cb!(185);
    t += 9000; // past sustain
    mockHolder.cb!(185); // commit starts, fetch hangs
    await flush();

    // User dials a manual pace while the 185 fetch is in flight.
    const manualTracks = [{ id: 'm1', name: 'Manual', artist: 'M', albumArtUrl: '', tempo: 200 }];
    (getRecommendations as jest.Mock).mockResolvedValueOnce(manualTracks);
    await engine.setManualPace(200);
    await flush();
    expect(playQueue).toHaveBeenLastCalledWith(['m1']);

    // The stale 185 fetch finally resolves — it must NOT touch the queue.
    resolveSlow([{ id: 'stale', name: 'Stale', artist: 'S', albumArtUrl: '', tempo: 185 }]);
    await flush();
    expect(playQueue).toHaveBeenLastCalledWith(['m1']); // unchanged
    expect(engine.getState().currentTrack?.id).toBe('m1');
    expect(engine.getState().managedCadence).toBe(200);
    nowSpy.mockRestore();
  });

  test('stop() during an in-flight playQueue does not crash and pauses the late playback', async () => {
    const engine = new SessionEngine();
    await engine.start({ vibe: 'hype' as Vibe });

    let resolvePlay!: () => void;
    (playQueue as jest.Mock).mockImplementationOnce(() => new Promise<void>((r) => (resolvePlay = r)));
    mockHolder.cb!(170); // first reading -> fetch -> playQueue hangs
    await flush();

    await engine.stop(); // session ends while playQueue is in flight
    resolvePlay(); // native call lands after stop
    await flush();

    expect(pause).toHaveBeenCalled(); // late playback start is undone
  });

  test('a stale replenish resolving after a pace change does not append old-tempo tracks', async () => {
    let t = 1000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => t);
    const engine = await startAndMove(); // queue t1,t2 @170

    // Replenish hangs.
    let resolveReplenish!: (tracks: MusicTrack[]) => void;
    (getRecommendations as jest.Mock).mockImplementationOnce(
      () => new Promise((r) => (resolveReplenish = r))
    );
    mockTrackHolder.cb!({ trackId: 't2', title: 'Song B' }); // advance to last -> replenish kicks off
    await flush();

    // Manual pace change reloads the queue while replenish is in flight.
    const newTracks = [{ id: 'n1', name: 'New', artist: 'N', albumArtUrl: '', tempo: 200 }];
    (getRecommendations as jest.Mock).mockResolvedValueOnce(newTracks);
    await engine.setManualPace(200);
    await flush();

    // Old replenish resolves with 170-tempo tracks: must be dropped.
    resolveReplenish([{ id: 'old9', name: 'Old', artist: 'O', albumArtUrl: '', tempo: 170 }]);
    await flush();
    expect(engine.getQueuedTrackIds()).not.toContain('old9');
    expect(queueTrack).not.toHaveBeenCalledWith('old9');
    nowSpy.mockRestore();
  });
});

describe('empty-fetch resilience', () => {
  test('an empty fetch on a pace change keeps the queue and reverts managed cadence', async () => {
    let t = 1000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => t);
    const engine = await startAndMove(); // managed 170, queue t1,t2
    (playQueue as jest.Mock).mockClear();

    (getRecommendations as jest.Mock).mockResolvedValueOnce([]); // network blip / no matches
    mockHolder.cb!(185);
    t += 9000;
    mockHolder.cb!(185);
    await flush();

    expect(playQueue).not.toHaveBeenCalled(); // old queue kept playing
    expect(engine.getState().currentTrack?.id).toBe('t1');
    expect(engine.getState().managedCadence).toBe(170); // reverted -> drift logic will retry
    expect(engine.getState().notice).toContain("Couldn't find songs");
    nowSpy.mockRestore();
  });
});
