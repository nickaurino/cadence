import { requireNativeModule } from 'expo-modules-core';

// Raw song metadata returned by the native Apple Music search. Note there is
// no tempo field — Apple's catalog has none, so BPM is resolved separately.
export interface RawSong {
  id: string;
  name: string;
  artist: string;
  albumArtUrl: string;
  isrc: string;
  previewUrl: string;
}

const CadenceMusicKit = requireNativeModule('CadenceMusicKit');

export function authorize(): Promise<boolean> {
  return CadenceMusicKit.authorize();
}

export function isAvailable(): Promise<boolean> {
  return CadenceMusicKit.isAvailable();
}

export function search(term: string, limit: number, offset = 0): Promise<RawSong[]> {
  return CadenceMusicKit.search(term, limit, offset);
}

// Estimates a song's BPM from its preview clip, or null if undeterminable.
export function analyzeBpm(previewUrl: string): Promise<number | null> {
  return CadenceMusicKit.analyzeBpm(previewUrl);
}

export function playTrack(id: string): Promise<void> {
  return CadenceMusicKit.playTrack(id);
}

export function queueTrack(id: string): Promise<void> {
  return CadenceMusicKit.queueTrack(id);
}

export function pause(): Promise<void> {
  return CadenceMusicKit.pause();
}

export function resume(): Promise<void> {
  return CadenceMusicKit.resume();
}

// Loads the whole matched queue into the system player so it plays through and
// skip can move between tracks.
export function playQueue(trackIds: string[]): Promise<void> {
  return CadenceMusicKit.playQueue(trackIds);
}

export function skipToNext(): Promise<void> {
  return CadenceMusicKit.skipToNext();
}

export function skipToPrevious(): Promise<void> {
  return CadenceMusicKit.skipToPrevious();
}

export type TrackChangeEvent = { trackId: string; title: string };

// Fires when the system player's current track changes — including when a song
// ends on its own and the player auto-advances.
export function addTrackChangeListener(
  cb: (event: TrackChangeEvent) => void
): { remove: () => void } {
  return CadenceMusicKit.addListener('onTrackChange', cb);
}
