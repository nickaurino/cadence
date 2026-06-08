import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../../modules/cadence-music-kit', () => ({
  authorize: jest.fn(),
  isAvailable: jest.fn(),
  search: jest.fn(),
  playTrack: jest.fn(),
  queueTrack: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { authorize, isAvailable, isAuthorized } from '@/music/auth';
import * as CadenceMusicKit from '../../../modules/cadence-music-kit';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authorize', () => {
  it('calls native authorize and saves token when granted', async () => {
    (CadenceMusicKit.authorize as jest.Mock).mockResolvedValue(true);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    await authorize();

    expect(CadenceMusicKit.authorize).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('music_authorized', 'true');
  });

  it('throws when native module denies authorization', async () => {
    (CadenceMusicKit.authorize as jest.Mock).mockResolvedValue(false);

    await expect(authorize()).rejects.toThrow('Apple Music authorization denied');
  });
});

describe('isAvailable', () => {
  it('returns true when native module reports available', async () => {
    (CadenceMusicKit.isAvailable as jest.Mock).mockResolvedValue(true);
    const result = await isAvailable();
    expect(result).toBe(true);
  });

  it('returns false when native module reports unavailable', async () => {
    (CadenceMusicKit.isAvailable as jest.Mock).mockResolvedValue(false);
    const result = await isAvailable();
    expect(result).toBe(false);
  });

  it('returns false when native module throws', async () => {
    (CadenceMusicKit.isAvailable as jest.Mock).mockRejectedValue(new Error('unavailable'));
    const result = await isAvailable();
    expect(result).toBe(false);
  });
});

describe('isAuthorized', () => {
  it('returns true when AsyncStorage has authorized flag', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const result = await isAuthorized();
    expect(result).toBe(true);
  });

  it('returns false when AsyncStorage has no flag', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await isAuthorized();
    expect(result).toBe(false);
  });
});
