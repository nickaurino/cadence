import type { MusicTrack, Vibe, MatchSettings } from '@/types';
import { DEFAULT_MATCH_SETTINGS } from '@/types';
import { search, type RawSong } from '../../modules/cadence-music-kit';
import { PreviewAnalysisProvider, resolveBpm, type BpmProvider } from './bpm';
import { closeness, matchesCadence, matchedTempo, type MatchOptions } from './match';

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

// Resolves BPM for each candidate, keeps the ones that match the target
// cadence (allowing half/double-time), and sorts by how tightly they match.
async function matchSongs(
  songs: RawSong[],
  targetBpm: number,
  provider: BpmProvider,
  options: MatchOptions
): Promise<MusicTrack[]> {
  const withBpm = await Promise.all(
    songs.map(async (song) => ({ song, bpm: await resolveBpm(song, provider) }))
  );

  return withBpm
    .filter(({ bpm }) => bpm !== null && matchesCadence(bpm, targetBpm, options))
    .sort((a, b) => closeness(a.bpm!, targetBpm, options) - closeness(b.bpm!, targetBpm, options))
    .map(({ song, bpm }) => {
      const effective = matchedTempo(bpm!, targetBpm, options)!;
      return {
        id: song.id,
        name: song.name,
        artist: song.artist,
        albumArtUrl: song.albumArtUrl,
        tempo: bpm!,
        matchMultiple: Math.round((effective / bpm!) * 100) / 100, // 1, 2, or 0.5
      };
    });
}

export async function getRecommendations(
  { targetBpm, vibe, page = 0, settings = DEFAULT_MATCH_SETTINGS }: RecommendationParams,
  provider: BpmProvider = defaultProvider
): Promise<MusicTrack[]> {
  try {
    const candidates = await gatherCandidates(VIBE_TO_TERMS[vibe], page);
    return await matchSongs(candidates, targetBpm, provider, settingsToOptions(settings));
  } catch {
    return [];
  }
}
