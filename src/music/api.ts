import type { MusicTrack, Vibe, MatchSettings } from '@/types';
import { DEFAULT_MATCH_SETTINGS } from '@/types';
import { search, type RawSong, type TrackFeatures } from '../../modules/cadence-music-kit';
import { PreviewAnalysisProvider, resolveFeatures, type FeatureProvider } from './features';
import { matchesCadence, matchedTempo, compositeScore, type MatchOptions } from './match';

// Turns user settings into the multiples + tolerance the matcher uses.
function settingsToOptions(s: MatchSettings): MatchOptions {
  const multiples: number[] = [];
  if (s.exact) multiples.push(1);
  if (s.doubleTime) multiples.push(2);
  if (s.halfTime) multiples.push(0.5);
  if (multiples.length === 0) multiples.push(1); // never leave it empty
  return { multiples, tolerance: s.tolerance };
}

// Each vibe maps to a few catalog search terms. Apple Music caps a single
// search at 25 results, so multiple terms widen the candidate pool before we
// filter by tempo.
const VIBE_TO_TERMS: Record<Vibe, string[]> = {
  hype: ['electronic', 'dance', 'edm'],
  hiphop: ['hip-hop', 'rap'],
  rock: ['rock', 'alternative'],
  pop: ['pop', 'top hits'],
  mix: ['workout', 'running', 'pop'],
};

const RESULTS_PER_TERM = 25;

interface RecommendationParams {
  targetBpm: number;
  vibe: Vibe;
  page?: number; // 0 = first page; higher pages page through the catalog for fresh songs
  settings?: MatchSettings;
}

const defaultProvider = new PreviewAnalysisProvider();

// Searches each term and dedupes by track id.
async function gatherCandidates(terms: string[], page: number): Promise<RawSong[]> {
  const offset = page * RESULTS_PER_TERM;
  const batches = await Promise.all(terms.map((term) => search(term, RESULTS_PER_TERM, offset)));
  const seen = new Set<string>();
  const unique: RawSong[] = [];
  for (const song of batches.flat()) {
    if (!seen.has(song.id)) {
      seen.add(song.id);
      unique.push(song);
    }
  }
  return unique;
}

// Resolves features for each candidate, keeps the ones whose BPM matches the
// target cadence (allowing half/double-time), and sorts by composite groove
// score (BPM closeness + pulse clarity + tempo stability), best first.
// Bounded concurrency: each cold candidate kicks off native audio analysis of a
// 30s clip; running all ~75 at once spikes CPU/memory. A small worker pool keeps
// throughput without the spike.
const ANALYSIS_CONCURRENCY = 5;

async function mapWithPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function matchSongs(
  songs: RawSong[],
  targetBpm: number,
  provider: FeatureProvider,
  options: MatchOptions
): Promise<MusicTrack[]> {
  const withFeatures = await mapWithPool(songs, ANALYSIS_CONCURRENCY, async (song) => ({
    song,
    features: await resolveFeatures(song, provider),
  }));

  return withFeatures
    .filter(
      (x): x is { song: RawSong; features: TrackFeatures } =>
        x.features !== null && matchesCadence(x.features.bpm, targetBpm, options)
    )
    // Descending: a higher composite score is a better match (was ascending by BPM closeness).
    .sort(
      (a, b) =>
        compositeScore(b.features, targetBpm, options) -
        compositeScore(a.features, targetBpm, options)
    )
    .map(({ song, features }) => {
      const effective = matchedTempo(features.bpm, targetBpm, options)!;
      return {
        id: song.id,
        name: song.name,
        artist: song.artist,
        albumArtUrl: song.albumArtUrl,
        tempo: features.bpm,
        matchMultiple: Math.round((effective / features.bpm) * 100) / 100, // 1, 2, or 0.5
      };
    });
}

export async function getRecommendations(
  { targetBpm, vibe, page = 0, settings = DEFAULT_MATCH_SETTINGS }: RecommendationParams,
  provider: FeatureProvider = defaultProvider
): Promise<MusicTrack[]> {
  try {
    const candidates = await gatherCandidates(VIBE_TO_TERMS[vibe], page);
    return await matchSongs(candidates, targetBpm, provider, settingsToOptions(settings));
  } catch {
    return [];
  }
}
