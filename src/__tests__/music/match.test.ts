import { matchedTempo, matchesCadence, closeness } from '@/music/match';

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
