import type { TrackFeatures } from '../../modules/cadence-music-kit';

// Cadence-to-song tempo matching.
//
// Running cadence (~160-180 spm) rarely lines up with a song's literal BPM,
// but you stride naturally to a song at half that tempo (every other beat) or
// double it. Which multiples count, and how tight the window is, are
// user-configurable (see settings).

export interface MatchOptions {
  multiples: number[]; // which song-BPM multiples count as a stride match
  tolerance: number; // match window as a fraction of the target cadence
}

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  multiples: [1, 2, 0.5],
  tolerance: 0.06,
};

// Returns the effective tempo (the song's BPM times whichever allowed multiple
// lands closest to the target) when within tolerance, or null when nothing
// matches.
export function matchedTempo(
  songBpm: number,
  targetBpm: number,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): number | null {
  if (!Number.isFinite(songBpm) || songBpm <= 0) return null;

  const window = targetBpm * options.tolerance;
  let best: number | null = null;
  let bestDelta = Infinity;

  for (const multiple of options.multiples) {
    const effective = songBpm * multiple;
    const delta = Math.abs(effective - targetBpm);
    if (delta <= window && delta < bestDelta) {
      best = effective;
      bestDelta = delta;
    }
  }

  return best;
}

// How far the song's best-matching multiple sits from the target. Lower is a
// tighter match. Returns Infinity for non-matches so they sort to the end.
export function closeness(
  songBpm: number,
  targetBpm: number,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): number {
  const effective = matchedTempo(songBpm, targetBpm, options);
  return effective === null ? Infinity : Math.abs(effective - targetBpm);
}

export function matchesCadence(
  songBpm: number,
  targetBpm: number,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): boolean {
  return matchedTempo(songBpm, targetBpm, options) !== null;
}

// How much each signal counts toward the final rank. A convex combination
// (sums to 1) so the score stays in [0,1]. Tunable; instrument skips later.
export const GROOVE_WEIGHTS = {
  closeness: 0.5,
  pulse: 0.3,
  stability: 0.2,
};

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

// Ranks a cadence-matched song in [0,1], higher is better. Blends how tightly
// the beat lands on the target (normalized against the match window) with how
// clear and steady that beat is. Callers must gate non-matches out first; a
// non-match contributes 0 closeness here.
export function compositeScore(
  features: TrackFeatures,
  targetBpm: number,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): number {
  const window = targetBpm * options.tolerance;
  const delta = closeness(features.bpm, targetBpm, options);
  const closenessTerm = window > 0 && Number.isFinite(delta) ? clamp01(1 - delta / window) : 0;

  return (
    GROOVE_WEIGHTS.closeness * closenessTerm +
    GROOVE_WEIGHTS.pulse * clamp01(features.pulseClarity) +
    GROOVE_WEIGHTS.stability * clamp01(features.tempoStability)
  );
}
