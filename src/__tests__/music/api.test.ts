jest.mock('../../../modules/cadence-music-kit', () => ({
  search: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import { getRecommendations } from '@/music/api';
import { search, type RawSong, type TrackFeatures } from '../../../modules/cadence-music-kit';
import { _clearMemoryCache, type FeatureProvider } from '@/music/features';

function song(id: string, name: string): RawSong {
  return {
    id,
    name,
    artist: `Artist ${id}`,
    albumArtUrl: `https://art/${id}.jpg`,
    isrc: `ISRC${id}`,
    previewUrl: `https://preview/${id}.m4a`,
  };
}

// target cadence 180. Features per song:
// a: 178 bpm, weak groove   -> matches (delta 2), poor pulse/stability
// b: 90 bpm, strong groove  -> matches double-time (delta 0), punchy + steady
// c: 120 bpm                -> no multiple within tolerance -> excluded
// d: null                   -> provider can't analyze it -> excluded
const FEATURES: Record<string, TrackFeatures | null> = {
  a: { bpm: 178, pulseClarity: 0.2, tempoStability: 0.2 },
  b: { bpm: 90, pulseClarity: 0.95, tempoStability: 0.95 },
  c: { bpm: 120, pulseClarity: 0.9, tempoStability: 0.9 },
  d: null,
};

const provider: FeatureProvider = {
  lookupFeatures: jest.fn(async (s: RawSong) => FEATURES[s.id] ?? null),
};

const allSongs = [song('a', 'A'), song('b', 'B'), song('c', 'C'), song('d', 'D')];

beforeEach(() => {
  jest.clearAllMocks();
  _clearMemoryCache();
});

describe('getRecommendations', () => {
  it('returns only cadence-matched songs, sorted by composite score, with real BPM', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    const result = await getRecommendations({ targetBpm: 180, vibe: 'pop' }, provider);

    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
    expect(result.find((t) => t.id === 'b')?.tempo).toBe(90);
    expect(result.find((t) => t.id === 'a')?.tempo).toBe(178);
  });

  it('lets strong groove outrank a tighter raw BPM match', async () => {
    const e = song('e', 'E');
    (search as jest.Mock).mockResolvedValue([song('a', 'A'), e]);
    const grooveProvider: FeatureProvider = {
      lookupFeatures: jest.fn(async (s: RawSong) =>
        s.id === 'a'
          ? { bpm: 178, pulseClarity: 0.1, tempoStability: 0.1 }
          : { bpm: 174, pulseClarity: 1, tempoStability: 1 }
      ),
    };

    const result = await getRecommendations({ targetBpm: 180, vibe: 'pop' }, grooveProvider);

    expect(result.map((t) => t.id)).toEqual(['e', 'a']);
  });

  it('searches every term for the vibe and dedupes by id', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    await getRecommendations({ targetBpm: 180, vibe: 'pop' }, provider);

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenCalledWith('pop', 25, 0);
    expect(search).toHaveBeenCalledWith('top hits', 25, 0);
  });

  it('pages through the catalog with offset for later pages', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    await getRecommendations({ targetBpm: 180, vibe: 'pop', page: 2 }, provider);

    expect(search).toHaveBeenCalledWith('pop', 25, 50);
  });

  it('respects match settings (exact-only drops the double-time song)', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    const result = await getRecommendations(
      {
        targetBpm: 180,
        vibe: 'pop',
        settings: { exact: true, halfTime: false, doubleTime: false, tolerance: 0.06 },
      },
      provider
    );

    expect(result.map((t) => t.id)).toEqual(['a']);
  });

  it('returns empty array when search throws', async () => {
    (search as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await getRecommendations({ targetBpm: 180, vibe: 'rock' }, provider);

    expect(result).toEqual([]);
  });
});
