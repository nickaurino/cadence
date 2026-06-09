import * as CadenceMusicKit from '../../modules/cadence-music-kit';

export async function playTrack(id: string): Promise<void> {
  await CadenceMusicKit.playTrack(id);
}

export async function queueTrack(id: string): Promise<void> {
  await CadenceMusicKit.queueTrack(id);
}

export async function pause(): Promise<void> {
  await CadenceMusicKit.pause();
}

export async function resume(): Promise<void> {
  await CadenceMusicKit.resume();
}

export async function playQueue(ids: string[]): Promise<void> {
  await CadenceMusicKit.playQueue(ids);
}

export async function skipToNext(): Promise<void> {
  await CadenceMusicKit.skipToNext();
}

export async function skipToPrevious(): Promise<void> {
  await CadenceMusicKit.skipToPrevious();
}

export async function getPlaybackStatus(): Promise<CadenceMusicKit.PlaybackStatus> {
  return CadenceMusicKit.getPlaybackStatus();
}

export function addTrackChangeListener(
  cb: (event: { trackId: string; title: string }) => void
): { remove: () => void } {
  return CadenceMusicKit.addTrackChangeListener(cb);
}

// MusicKit needs no explicit disconnection
export async function disconnect(): Promise<void> {}
