import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeTrack, type RawSong, type TrackFeatures } from '../../modules/cadence-music-kit';

// Apple's catalog exposes no tempo or audio features, so we compute them
// ourselves on-device by analyzing each song's 30-second preview clip (see the
// native TempoAnalyzer). Results are cached by ISRC so each song is only
// analyzed once, ever.

export interface FeatureProvider {
  lookupFeatures(song: RawSong): Promise<TrackFeatures | null>;
}

const CACHE_PREFIX = 'feat:';
const MISS = 'null';
const memoryCache = new Map<string, TrackFeatures | null>();

// Estimates a song's features from its Apple Music preview clip via the native
// analyzer. Songs without a preview can't be analyzed.
export class PreviewAnalysisProvider implements FeatureProvider {
  async lookupFeatures(song: RawSong): Promise<TrackFeatures | null> {
    if (!song.previewUrl) return null;
    return analyzeTrack(song.previewUrl);
  }
}

// Resolves a song's features through the cache, falling back to the provider on
// a miss. Misses are cached too, so we don't re-query songs the provider can't
// analyze. Songs without an ISRC bypass the cache entirely.
export async function resolveFeatures(
  song: RawSong,
  provider: FeatureProvider
): Promise<TrackFeatures | null> {
  const key = song.isrc ? `${CACHE_PREFIX}${song.isrc}` : null;

  if (key && memoryCache.has(key)) return memoryCache.get(key)!;

  if (key) {
    const cached = await AsyncStorage.getItem(key);
    if (cached !== null) {
      try {
        const value = cached === MISS ? null : (JSON.parse(cached) as TrackFeatures);
        memoryCache.set(key, value);
        return value;
      } catch {
        // corrupted cache entry: fall through and re-analyze
      }
    }
  }

  let result: TrackFeatures | null = null;
  try {
    result = await provider.lookupFeatures(song);
  } catch {
    result = null;
  }

  if (key) {
    memoryCache.set(key, result);
    // A failed cache write must not reject the lookup — one storage hiccup would
    // otherwise nuke the whole recommendation batch via Promise rejection.
    try {
      await AsyncStorage.setItem(key, result === null ? MISS : JSON.stringify(result));
    } catch {
      // memory cache still holds it for this session
    }
  }

  return result;
}

// Exposed for tests.
export function _clearMemoryCache(): void {
  memoryCache.clear();
}
