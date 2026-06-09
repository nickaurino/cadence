// src/types.ts

// The vibe/genre direction for song recommendations
export type Vibe = 'hype' | 'hiphop' | 'rock' | 'pop' | 'mix';

// How eagerly managed cadence follows perceived cadence.
export type Sensitivity = 'responsive' | 'balanced' | 'relaxed';

// How a managed-cadence change reaches the music.
export type SongSwitching = 'boundary' | 'immediate';

// User-customizable song matching settings.
export interface MatchSettings {
  exact: boolean; // songs whose beat lands on your cadence
  halfTime: boolean; // songs at half your cadence (90 BPM for a 180 step rate)
  doubleTime: boolean; // songs at double your cadence
  tolerance: number; // match window as a fraction of cadence
  sensitivity: Sensitivity;
  songSwitching: SongSwitching;
}

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  exact: true,
  halfTime: true,
  doubleTime: true,
  tolerance: 0.06,
  sensitivity: 'balanced',
  songSwitching: 'boundary',
};

// Pace sensitivity → (drift threshold in spm, sustain time in ms) for moving
// managed cadence.
export const SENSITIVITY_PRESETS: Record<Sensitivity, { threshold: number; sustainMs: number }> = {
  responsive: { threshold: 10, sustainMs: 8000 },
  balanced: { threshold: 12, sustainMs: 12000 },
  relaxed: { threshold: 16, sustainMs: 20000 },
};

// A music track with the fields we care about
export interface MusicTrack {
  id: string;          // Apple Music track identifier
  name: string;
  artist: string;
  albumArtUrl: string;
  tempo: number;       // BPM (the song's true tempo)
  matchMultiple?: number; // how its beat maps to your cadence: 1, 2 (double), or 0.5 (half)
}

// End-of-session stats shown on the summary screen.
export interface SessionSummary {
  durationSec: number;
  steps: number;
  avgCadence: number; // average perceived cadence over the session
  songsPlayed: number;
  distanceMi: number; // rough estimate from steps (no GPS)
}

// The state of an active session
export interface SessionState {
  vibe: Vibe;
  perceivedCadence: number; // live, smoothed steps/min (the hero number)
  managedCadence: number; // stable value the song queue is matched to
  isCalibrating: boolean; // waiting for the first movement / pace
  isLoadingTracks: boolean; // pace known, fetching matched songs
  paceLocked: boolean; // user manually froze the managed cadence (treadmill/manual)
  inThePocket: boolean; // perceived sits within the match band of managed (or locked); false while calibrating
  pocketCloseness: number; // 0..1, how close perceived sits to managed (1 = locked, 0 = at/over the drift band). Drives the ring warmth.
  isPlaying: boolean;
  notice: string | null; // transient message (e.g. pace change, out of range)
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  startedAt: number; // Date.now()
}

// Rolling window for perceived cadence: steps in the last WINDOW seconds / WINDOW.
export const CADENCE_WINDOW_MS = 8000;
// Don't report a number until this much data has accumulated (still warming up).
export const CADENCE_MIN_DATA_SEC = 3;
// How often the detector recomputes perceived cadence (independent of pedometer
// event timing, so it decays to 0 when you stop).
export const CADENCE_TICK_MS = 1000;

// Human cadence guard rails (steps/min). Readings outside this band are treated
// as sensor noise / impossible: we keep the current target and flag it.
// 240 clears sustained sprinting (~200-220); below 50 isn't purposeful walking.
// Both ends remain matchable to real songs via half/double-time.
export const CADENCE_FLOOR = 50;
export const CADENCE_CEILING = 240;
