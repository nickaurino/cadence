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
  disconnect: jest.fn().mockResolvedValue(undefined),
}));

import { playQueue, queueTrack, skipToNext, skipToPrevious, pause, resume } from '@/music/player';
import { getRecommendations } from '@/music/api';
import { getMatchSettings } from '@/storage/store';

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

test('togglePlayPause pauses then resumes', async () => {
  const engine = await startAndMove();

  await engine.togglePlayPause();
  expect(pause).toHaveBeenCalled();
  expect(engine.getState().isPlaying).toBe(false);

  await engine.togglePlayPause();
  expect(resume).toHaveBeenCalled();
  expect(engine.getState().isPlaying).toBe(true);
});
