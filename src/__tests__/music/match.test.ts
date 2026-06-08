import {
  matchedTempo,
  matchesCadence,
  closeness,
  compositeScore,
  GROOVE_WEIGHTS,
} from '@/music/match';
import type { TrackFeatures } from '../../../modules/cadence-music-kit';

describe('matchedTempo', () => {
  it('matches a song at the target tempo', () => {
    expect(matchedTempo(180, 180)).toBe(180);
  });

  it('matches a song at half the cadence (double-time stride)', () => {
    expect(matchedTempo(90, 180)).toBe(180);
  });

  it('matches a song at double the cadence (half-time stride)', () => {
    expect(matchedTempo(360, 180)).toBe(180);
  });

  it('returns null when no multiple lands within tolerance', () => {
    expect(matchedTempo(120, 180)).toBeNull();
  });

  it('honors the tolerance window (±6% of 180 ≈ ±10.8)', () => {
    expect(matchedTempo(170, 180)).toBe(170); // delta 10, inside
    expect(matchedTempo(168, 180)).toBeNull(); // delta 12, outside; no multiple helps
  });

  it('picks the closest multiple when several are plausible', () => {
    // target 120: as-is 61 (delta 59) vs double 122 (delta 2) -> double wins
    expect(matchedTempo(61, 120)).toBe(122);
  });

  it('rejects invalid tempos', () => {
    expect(matchedTempo(0, 180)).toBeNull();
    expect(matchedTempo(-90, 180)).toBeNull();
    expect(matchedTempo(NaN, 180)).toBeNull();
  });

  it('only considers the allowed multiples', () => {
    // 180 BPM matches a 90 target only via half-time (×0.5).
    expect(matchedTempo(180, 90, { multiples: [1, 2, 0.5], tolerance: 0.06 })).toBe(90);
    expect(matchedTempo(180, 90, { multiples: [1, 2], tolerance: 0.06 })).toBeNull();
  });

  it('honors a custom tolerance', () => {
    expect(matchedTempo(170, 180, { multiples: [1], tolerance: 0.02 })).toBeNull(); // window 3.6
    expect(matchedTempo(170, 180, { multiples: [1], tolerance: 0.1 })).toBe(170); // window 18
  });
});

describe('matchesCadence', () => {
  it('is true for a matching song and false otherwise', () => {
    expect(matchesCadence(90, 180)).toBe(true);
    expect(matchesCadence(120, 180)).toBe(false);
  });
});

describe('closeness', () => {
  it('returns the delta of the best multiple for matches', () => {
    expect(closeness(178, 180)).toBe(2);
    expect(closeness(90, 180)).toBe(0);
  });

  it('returns Infinity for non-matches', () => {
    expect(closeness(120, 180)).toBe(Infinity);
  });
});

describe('compositeScore', () => {
  const opts = { multiples: [1, 2, 0.5], tolerance: 0.06 };

  function feat(o: Partial<TrackFeatures> = {}): TrackFeatures {
    return { bpm: 180, pulseClarity: 0.5, tempoStability: 0.5, ...o };
  }

  it('scores a perfect BPM match with perfect groove at 1', () => {
    const score = compositeScore(feat({ bpm: 180, pulseClarity: 1, tempoStability: 1 }), 180, opts);
    expect(score).toBeCloseTo(1, 5);
  });

  it('scores a perfect BPM match with zero groove at the closeness weight', () => {
    const score = compositeScore(feat({ bpm: 180, pulseClarity: 0, tempoStability: 0 }), 180, opts);
    expect(score).toBeCloseTo(GROOVE_WEIGHTS.closeness, 5);
  });

  it('ranks better groove above a marginally tighter BPM', () => {
    const tight = compositeScore(feat({ bpm: 180, pulseClarity: 0.1, tempoStability: 0.1 }), 180, opts);
    const groovy = compositeScore(feat({ bpm: 178, pulseClarity: 1, tempoStability: 1 }), 180, opts);
    expect(groovy).toBeGreaterThan(tight);
  });

  it('weights are a convex combination (sum to 1)', () => {
    const sum = GROOVE_WEIGHTS.closeness + GROOVE_WEIGHTS.pulse + GROOVE_WEIGHTS.stability;
    expect(sum).toBeCloseTo(1, 5);
  });

  it('clamps groove inputs outside [0,1] so the score stays in [0,1]', () => {
    const high = compositeScore(feat({ bpm: 180, pulseClarity: 5, tempoStability: 5 }), 180, opts);
    const low = compositeScore(feat({ bpm: 180, pulseClarity: -5, tempoStability: -5 }), 180, opts);
    expect(high).toBeLessThanOrEqual(1);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it('uses the matched multiple, so a double-time song at the target scores full closeness', () => {
    const score = compositeScore(feat({ bpm: 90, pulseClarity: 1, tempoStability: 1 }), 180, opts);
    expect(score).toBeCloseTo(1, 5);
  });
});
