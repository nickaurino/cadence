import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeBpm, type RawSong } from '../../modules/cadence-music-kit';

// Apple's catalog exposes no tempo, so we compute BPM ourselves on-device by
// analyzing each song's 30-second preview clip (see the native TempoAnalyzer).
// Results are cached by ISRC so each song is only analyzed once, ever.

export interface BpmProvider {
  lookupBpm(song: RawSong): Promise<number | null>;
}

const CACHE_PREFIX = 'bpm:';
const MISS = 'null';
const memoryCache = new Map<string, number | null>();

// Estimates BPM from the song's Apple Music preview clip via the native
// analyzer. Songs without a preview can't be analyzed.
export class PreviewAnalysisProvider implements BpmProvider {
  async lookupBpm(song: RawSong): Promise<number | null> {
    if (!song.previewUrl) return null;
    return analyzeBpm(song.previewUrl);
  }
}

// Resolves a song's BPM through the cache, falling back to the provider on a
// miss. Misses are cached too, so we don't re-query songs the provider can't
// find. Songs without an ISRC bypass the cache entirely.
export async function resolveBpm(
  song: RawSong,
  provider: BpmProvider
): Promise<number | null> {
  const key = song.isrc ? `${CACHE_PREFIX}${song.isrc}` : null;

  if (key && memoryCache.has(key)) return memoryCache.get(key)!;

  if (key) {
    const cached = await AsyncStorage.getItem(key);
    if (cached !== null) {
      const value = cached === MISS ? null : Number(cached);
      memoryCache.set(key, value);
      return value;
    }
  }

  let bpm: number | null = null;
  try {
    bpm = await provider.lookupBpm(song);
  } catch {
    bpm = null;
  }

  if (key) {
    memoryCache.set(key, bpm);
    await AsyncStorage.setItem(key, bpm === null ? MISS : String(bpm));
  }

  return bpm;
}

// Exposed for tests.
export function _clearMemoryCache(): void {
  memoryCache.clear();
}
