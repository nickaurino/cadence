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
