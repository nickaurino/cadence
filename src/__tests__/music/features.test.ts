jest.mock('../../../modules/cadence-music-kit', () => ({
  analyzeTrack: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PreviewAnalysisProvider,
  resolveFeatures,
  _clearMemoryCache,
  type FeatureProvider,
} from '@/music/features';
import { analyzeTrack, type RawSong, type TrackFeatures } from '../../../modules/cadence-music-kit';

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

function features(overrides: Partial<TrackFeatures> = {}): TrackFeatures {
  return { bpm: 120, pulseClarity: 0.8, tempoStability: 0.9, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  _clearMemoryCache();
});

describe('resolveFeatures caching', () => {
  it('queries the provider on a cache miss and stores the result', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const f = features();
    const provider: FeatureProvider = { lookupFeatures: jest.fn().mockResolvedValue(f) };

    const result = await resolveFeatures(song(), provider);

    expect(result).toEqual(f);
    expect(provider.lookupFeatures).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('feat:ISRC1', JSON.stringify(f));
  });

  it('returns stored features without calling the provider', async () => {
    const f = features({ bpm: 128 });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(f));
    const provider: FeatureProvider = { lookupFeatures: jest.fn() };

    const result = await resolveFeatures(song(), provider);

    expect(result).toEqual(f);
    expect(provider.lookupFeatures).not.toHaveBeenCalled();
  });

  it('honors a cached miss without re-querying', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('null');
    const provider: FeatureProvider = { lookupFeatures: jest.fn() };

    const result = await resolveFeatures(song(), provider);

    expect(result).toBeNull();
    expect(provider.lookupFeatures).not.toHaveBeenCalled();
  });

  it('caches a provider miss so it is not retried', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const provider: FeatureProvider = { lookupFeatures: jest.fn().mockResolvedValue(null) };

    await resolveFeatures(song(), provider);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('feat:ISRC1', 'null');
  });

  it('falls back to null when the provider throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const provider: FeatureProvider = {
      lookupFeatures: jest.fn().mockRejectedValue(new Error('boom')),
    };

    const result = await resolveFeatures(song(), provider);

    expect(result).toBeNull();
  });
});

describe('PreviewAnalysisProvider', () => {
  it('returns the analyzer result for a song with a preview', async () => {
    const f = features({ bpm: 126 });
    (analyzeTrack as jest.Mock).mockResolvedValue(f);

    const result = await new PreviewAnalysisProvider().lookupFeatures(song());

    expect(result).toEqual(f);
    expect(analyzeTrack).toHaveBeenCalledWith('https://preview/1.m4a');
  });

  it('returns null without analyzing when there is no preview', async () => {
    const result = await new PreviewAnalysisProvider().lookupFeatures(song({ previewUrl: '' }));

    expect(result).toBeNull();
    expect(analyzeTrack).not.toHaveBeenCalled();
  });
});
