import { perceivedCadence, CadenceDetector } from '@/sensors/cadence';
import { CADENCE_WINDOW_MS } from '@/types';
import { Pedometer } from 'expo-sensors';

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
    getStepCountAsync: jest.fn(),
  },
}));

describe('perceivedCadence', () => {
  it('computes steps in the window over elapsed time', () => {
    // 18 steps across 6 seconds = 180 spm
    expect(perceivedCadence([{ t: 0, steps: 0 }, { t: 6000, steps: 18 }], 6000)).toBe(180);
  });

  it('cancels the cumulative step offset (delta only)', () => {
    // cumulative 1000 -> 1024 over 8s = 24/8*60 = 180
    expect(perceivedCadence([{ t: 0, steps: 1000 }, { t: 8000, steps: 1024 }], 8000)).toBe(180);
  });

  it('returns null while still warming up (< min data)', () => {
    expect(perceivedCadence([{ t: 0, steps: 0 }], 1000)).toBeNull(); // 1s span < 3s
    expect(perceivedCadence([], 5000)).toBeNull();
  });

  it('decays toward 0 when steps stop arriving', () => {
    // newest sample is 12s old, no new steps -> rate collapses to 0
    expect(perceivedCadence([{ t: 0, steps: 0 }, { t: 4000, steps: 12 }], 16000)).toBe(0);
  });
});

describe('CadenceDetector.seedFromHistory', () => {
  const getStepCountAsync = Pedometer.getStepCountAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (Pedometer.watchStepCount as jest.Mock).mockReturnValue({ remove: jest.fn() });
  });

  it('emits one immediate cadence estimate from recent history', async () => {
    const steps = 24;
    const expectedSpm = Math.round((steps / (CADENCE_WINDOW_MS / 1000)) * 60);
    getStepCountAsync.mockResolvedValue({ steps });

    const detector = new CadenceDetector();
    const cb = jest.fn();
    detector.start(cb);
    await detector.seedFromHistory();

    expect(cb).toHaveBeenCalledWith(expectedSpm);
    detector.stop();
  });

  it('emits nothing when no steps in history (spm 0)', async () => {
    getStepCountAsync.mockResolvedValue({ steps: 0 });

    const detector = new CadenceDetector();
    const cb = jest.fn();
    detector.start(cb);
    await detector.seedFromHistory();

    expect(cb).not.toHaveBeenCalled();
    detector.stop();
  });

  it('swallows errors when history is unavailable', async () => {
    getStepCountAsync.mockRejectedValue(new Error('no permission'));

    const detector = new CadenceDetector();
    const cb = jest.fn();
    detector.start(cb);

    await expect(detector.seedFromHistory()).resolves.toBeUndefined();
    expect(cb).not.toHaveBeenCalled();
    detector.stop();
  });
});
