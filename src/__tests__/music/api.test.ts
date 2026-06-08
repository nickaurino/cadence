jest.mock('../../../modules/cadence-music-kit', () => ({
  search: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import { getRecommendations } from '@/music/api';
import { search, type RawSong } from '../../../modules/cadence-music-kit';
import { _clearMemoryCache, type BpmProvider } from '@/music/bpm';

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

// target cadence 180: exact-ish, half-time (90 -> 180), off-tempo, and unknown.
const BPM: Record<string, number | null> = {
  a: 178, // matches as-is (delta 2)
  b: 90, // matches double-time (delta 0) -> closest
  c: 120, // no multiple within tolerance -> excluded
  d: null, // provider can't find it -> excluded
};

const provider: BpmProvider = {
  lookupBpm: jest.fn(async (s: RawSong) => BPM[s.id] ?? null),
};

const allSongs = [song('a', 'A'), song('b', 'B'), song('c', 'C'), song('d', 'D')];

beforeEach(() => {
  jest.clearAllMocks();
  _clearMemoryCache();
});

describe('getRecommendations', () => {
  it('returns only cadence-matched songs, sorted by closeness, with real BPM', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    const result = await getRecommendations({ targetBpm: 180, vibe: 'pop' }, provider);

    expect(result.map((t) => t.id)).toEqual(['b', 'a']); // b (delta 0) before a (delta 2)
    expect(result.find((t) => t.id === 'b')?.tempo).toBe(90); // true BPM, not effective
    expect(result.find((t) => t.id === 'a')?.tempo).toBe(178);
  });

  it('searches every term for the vibe and dedupes by id', async () => {
    (search as jest.Mock).mockResolvedValue(allSongs);

    await getRecommendations({ targetBpm: 180, vibe: 'pop' }, provider);

    expect(search).toHaveBeenCalledTimes(2); // 'pop' maps to two terms
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

    // 'a' (178) matches exactly; 'b' (90) only matched via double-time, now off.
    expect(result.map((t) => t.id)).toEqual(['a']);
  });

  it('returns empty array when search throws', async () => {
    (search as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await getRecommendations({ targetBpm: 180, vibe: 'rock' }, provider);

    expect(result).toEqual([]);
  });
});
