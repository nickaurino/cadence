jest.mock('../../../modules/cadence-music-kit', () => ({
  authorize: jest.fn(),
  isAvailable: jest.fn(),
  search: jest.fn(),
  playTrack: jest.fn(),
  queueTrack: jest.fn(),
}));

import { playTrack, queueTrack, disconnect } from '@/music/player';
import * as CadenceMusicKit from '../../../modules/cadence-music-kit';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('playTrack', () => {
  it('calls native playTrack with the track id', async () => {
    (CadenceMusicKit.playTrack as jest.Mock).mockResolvedValue(undefined);
    await playTrack('track-123');
    expect(CadenceMusicKit.playTrack).toHaveBeenCalledWith('track-123');
  });

  it('throws when native module rejects', async () => {
    (CadenceMusicKit.playTrack as jest.Mock).mockRejectedValue(new Error('play failed'));
    await expect(playTrack('track-123')).rejects.toThrow('play failed');
  });
});

describe('queueTrack', () => {
  it('calls native queueTrack with the track id', async () => {
    (CadenceMusicKit.queueTrack as jest.Mock).mockResolvedValue(undefined);
    await queueTrack('track-456');
    expect(CadenceMusicKit.queueTrack).toHaveBeenCalledWith('track-456');
  });
});

describe('disconnect', () => {
  it('resolves without calling any native method', async () => {
    await expect(disconnect()).resolves.toBeUndefined();
    expect(CadenceMusicKit.playTrack).not.toHaveBeenCalled();
    expect(CadenceMusicKit.queueTrack).not.toHaveBeenCalled();
  });
});
