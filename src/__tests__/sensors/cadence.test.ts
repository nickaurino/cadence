import { perceivedCadence } from '@/sensors/cadence';

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
