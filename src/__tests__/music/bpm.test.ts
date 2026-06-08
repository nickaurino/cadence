jest.mock('../../../modules/cadence-music-kit', () => ({
  analyzeBpm: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PreviewAnalysisProvider,
  resolveBpm,
  _clearMemoryCache,
  type BpmProvider,
} from '@/music/bpm';
import { analyzeBpm, type RawSong } from '../../../modules/cadence-music-kit';

function song(overrides: Partial<RawSong> = {}): RawSong {
  return {
    id: '1',
    name: 'Song',
    artist: 'Artist',
    albumArtUrl: '',
    isrc: 'ISRC1',
    previewUrl: 'https://preview/1.m4a',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  _clearMemoryCache();
});

describe('resolveBpm caching', () => {
  it('queries the provider on a cache miss and stores the result', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const provider: BpmProvider = { lookupBpm: jest.fn().mockResolvedValue(120) };

    const bpm = await resolveBpm(song(), provider);

    expect(bpm).toBe(120);
    expect(provider.lookupBpm).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('bpm:ISRC1', '120');
  });

  it('returns a stored BPM without calling the provider', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('128');
    const provider: BpmProvider = { lookupBpm: jest.fn() };

    const bpm = await resolveBpm(song(), provider);

    expect(bpm).toBe(128);
    expect(provider.lookupBpm).not.toHaveBeenCalled();
  });

  it('honors a cached miss without re-querying', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('null');
    const provider: BpmProvider = { lookupBpm: jest.fn() };

    const bpm = await resolveBpm(song(), provider);

    expect(bpm).toBeNull();
    expect(provider.lookupBpm).not.toHaveBeenCalled();
  });

  it('caches a provider miss so it is not retried', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const provider: BpmProvider = { lookupBpm: jest.fn().mockResolvedValue(null) };

    await resolveBpm(song(), provider);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('bpm:ISRC1', 'null');
  });

  it('falls back to null when the provider throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const provider: BpmProvider = { lookupBpm: jest.fn().mockRejectedValue(new Error('boom')) };

    const bpm = await resolveBpm(song(), provider);

    expect(bpm).toBeNull();
  });
});

describe('PreviewAnalysisProvider', () => {
  it('returns the analyzer result for a song with a preview', async () => {
    (analyzeBpm as jest.Mock).mockResolvedValue(126);

    const bpm = await new PreviewAnalysisProvider().lookupBpm(song());

    expect(bpm).toBe(126);
    expect(analyzeBpm).toHaveBeenCalledWith('https://preview/1.m4a');
  });

  it('returns null without analyzing when there is no preview', async () => {
    const bpm = await new PreviewAnalysisProvider().lookupBpm(song({ previewUrl: '' }));

    expect(bpm).toBeNull();
    expect(analyzeBpm).not.toHaveBeenCalled();
  });
});
