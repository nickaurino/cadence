// src/engine/session.ts

import { CadenceDetector } from '@/sensors/cadence';
import { getRecommendations } from '@/music/api';
import {
  playQueue,
  queueTrack,
  skipToNext,
  skipToPrevious,
  pause,
  resume,
  addTrackChangeListener,
  disconnect,
} from '@/music/player';
import {
  SessionState,
  SessionSummary,
  MusicTrack,
  Vibe,
  MatchSettings,
  DEFAULT_MATCH_SETTINGS,
  SENSITIVITY_PRESETS,
  CADENCE_FLOOR,
  CADENCE_CEILING,
} from '@/types';

// Rough stride for a step-count -> distance estimate (no GPS).
const METERS_PER_STEP = 0.78;
const METERS_PER_MILE = 1609.34;
import { getMatchSettings } from '@/storage/store';
import { PersistedSession, savePersisted, clearPersisted } from '@/storage/session-store';

interface StartOptions {
  vibe: Vibe;
}

type StateChangeCallback = (state: SessionState) => void;

// Fetch more songs once this few remain after the current track.
const REPLENISH_THRESHOLD = 2;

const PACE_CHANGE_NOTICE = 'Pace changed. New songs up next, or skip to switch now.';

export class SessionEngine {
  private _state: SessionState | null = null;
  private _detector = new CadenceDetector();
  private _onStateChange: StateChangeCallback | null = null;
  private _paceLocked = false;
  private _tracks: MusicTrack[] = [];
  private _index = 0;
  private _page = 0;
  private _replenishing = false;
  private _committing = false; // a managed-cadence re-fetch is in flight
  private _resuming = false; // a resume is in flight; recover if the player moved past our queue
  private _managedSince: number | null = null; // when the current drift began
  private _pendingTracks: MusicTrack[] | null = null; // queued for the next boundary
  private _smoothedPerceived: number | null = null; // EMA for a calmer displayed number
  private _settings: MatchSettings = DEFAULT_MATCH_SETTINGS;
  private _trackSub: { remove: () => void } | null = null;
  // Session stats for the end summary.
  private _cadenceSum = 0;
  private _cadenceCount = 0;
  private _playedIds = new Set<string>();
  private _lastPersist = 0;

  onStateChange(cb: StateChangeCallback): void {
    this._onStateChange = cb;
  }

  // Force a snapshot write immediately (e.g. when the app backgrounds).
  persistNow(): void {
    this._persist(true);
  }

  // Emit an immediate cadence estimate from pedometer history (resume/foreground).
  async seedCadenceFromHistory(): Promise<void> {
    await this._detector.seedFromHistory();
  }

  private _emit(): void {
    if (this._state && this._onStateChange) this._onStateChange({ ...this._state });
    this._persist();
  }

  // Snapshot the durable session state for resume. Null when no session is live.
  serialize(): PersistedSession | null {
    if (!this._state) return null;
    return {
      version: 1,
      vibe: this._state.vibe,
      startedAt: this._state.startedAt,
      tracks: this._tracks,
      index: this._index,
      page: this._page,
      settings: this._settings,
      paceLocked: this._paceLocked,
      managedCadence: this._state.managedCadence,
      cadenceSum: this._cadenceSum,
      cadenceCount: this._cadenceCount,
      playedIds: [...this._playedIds],
    };
  }

  // Throttled fire-and-forget write. Durable fields change seldom, so a 3s
  // window keeps disk writes rare. Never throws into the engine.
  private _persist(force = false): void {
    if (!this._state) return;
    const snapshot = this.serialize();
    if (!snapshot) return;
    if (!force && Date.now() - this._lastPersist < 3000) return;
    this._lastPersist = Date.now();
    savePersisted(snapshot).catch(() => {});
  }

  private _syncTracks(): void {
    if (!this._state) return;
    this._state.currentTrack = this._tracks[this._index] ?? null;
    this._state.queue = this._tracks.slice(this._index + 1);
    if (this._state.currentTrack) this._playedIds.add(this._state.currentTrack.id);
  }

  async start({ vibe }: StartOptions): Promise<void> {
    this._resuming = false;
    this._smoothedPerceived = null;
    this._cadenceSum = 0;
    this._cadenceCount = 0;
    this._playedIds = new Set();
    this._state = {
      vibe,
      perceivedCadence: 0,
      managedCadence: 0,
      isCalibrating: true,
      isLoadingTracks: false,
      paceLocked: false,
      isPlaying: false,
      notice: null,
      currentTrack: null,
      queue: [],
      startedAt: Date.now(),
    };
    this._emit();

    this._settings = await getMatchSettings();

    this._trackSub = addTrackChangeListener(({ trackId }) => this._onNativeTrackChange(trackId));

    // Don't play anything yet — wait until we read the user's actual pace.
    this._detector.start((spm) => {
      this._onPerceivedCadence(spm).catch((e) => {
        console.error('[SessionEngine] cadence handler error:', e);
      });
    });
  }

  // Rehydrate from a saved snapshot instead of start(). The music is already
  // playing on the system player, so we re-attach to it rather than refetch or
  // replay the queue.
  async resumeFrom(snapshot: PersistedSession): Promise<void> {
    this._settings = snapshot.settings;
    this._tracks = snapshot.tracks;
    this._index = snapshot.index;
    this._page = snapshot.page;
    this._paceLocked = snapshot.paceLocked;
    this._cadenceSum = snapshot.cadenceSum;
    this._cadenceCount = snapshot.cadenceCount;
    this._playedIds = new Set(snapshot.playedIds);

    this._smoothedPerceived = null;
    this._managedSince = null;
    this._pendingTracks = null;
    this._committing = false;
    this._replenishing = false;

    // Prefer the stored managed cadence — it's the real target after any pace
    // ramp. Fall back to the session average for forward-compat/safety.
    const managed =
      snapshot.managedCadence ??
      (snapshot.cadenceCount > 0 ? Math.round(snapshot.cadenceSum / snapshot.cadenceCount) : 0);

    this._state = {
      vibe: snapshot.vibe,
      perceivedCadence: 0,
      managedCadence: managed,
      isCalibrating: false,
      isLoadingTracks: false,
      paceLocked: snapshot.paceLocked,
      isPlaying: true,
      notice: null,
      currentTrack: null,
      queue: [],
      startedAt: snapshot.startedAt,
    };

    this._syncTracks();
    this._resuming = true;
    // Re-attaching makes the native side emit the currently-playing track,
    // which realigns _index if the player advanced while we were away.
    this._trackSub = addTrackChangeListener(({ trackId }) => this._onNativeTrackChange(trackId));
    this._emit();

    this._detector.start((spm) => {
      this._onPerceivedCadence(spm).catch((e) => {
        console.error('[SessionEngine] cadence handler error:', e);
      });
    });
  }

  private async _onPerceivedCadence(spm: number): Promise<void> {
    if (!this._state) return;

    // Light EMA so the displayed number doesn't twitch second to second. Guard
    // rails and managed logic still use the raw windowed value below.
    this._smoothedPerceived =
      this._smoothedPerceived === null ? spm : this._smoothedPerceived * 0.6 + spm * 0.4;
    this._state.perceivedCadence = Math.round(this._smoothedPerceived);

    // Above the ceiling = sensor noise: show it, flag it, don't manage.
    if (spm > CADENCE_CEILING) {
      this._state.notice = `Read ${spm} spm. Too fast to be real, holding ${this._state.managedCadence}.`;
      this._emit();
      return;
    }

    // Below the floor (incl. 0 when stopped): keep playing, don't re-manage.
    if (spm < CADENCE_FLOOR) {
      this._emit();
      return;
    }

    // Real movement — fold into the session average.
    this._cadenceSum += spm;
    this._cadenceCount += 1;

    // A re-fetch is already running — just keep the display live.
    if (this._committing) {
      this._emit();
      return;
    }

    // First valid pace: lock managed immediately and start the music.
    if (this._state.isCalibrating) {
      this._state.isCalibrating = false;
      this._state.managedCadence = spm;
      this._managedSince = null;
      await this._commitManaged(spm, true);
      return;
    }

    if (this._paceLocked) {
      this._emit();
      return;
    }

    // Managed cadence follows perceived only on sustained drift.
    const { threshold, sustainMs } = SENSITIVITY_PRESETS[this._settings.sensitivity];
    const drift = Math.abs(spm - this._state.managedCadence);
    if (drift >= threshold) {
      if (this._managedSince === null) this._managedSince = Date.now();
      if (Date.now() - this._managedSince >= sustainMs) {
        this._managedSince = null;
        this._state.managedCadence = spm;
        await this._commitManaged(spm, this._settings.songSwitching === 'immediate');
        return;
      }
    } else {
      this._managedSince = null;
    }

    this._emit();
  }

  // Applies a managed-cadence change to the music. `immediate` swaps now;
  // otherwise the new queue waits for the next song boundary.
  private async _commitManaged(spm: number, immediate: boolean): Promise<void> {
    if (!this._state) return;
    this._committing = true;
    try {
      if (immediate || this._tracks.length === 0) {
        await this._refetchAndLoad(spm);
        return;
      }

      this._state.isLoadingTracks = true;
      this._emit();
      const tracks = await getRecommendations({
        targetBpm: spm,
        vibe: this._state.vibe,
        settings: this._settings,
      });
      if (!this._state) return;
      this._state.isLoadingTracks = false;
      this._pendingTracks = tracks.length > 0 ? tracks : null;
      if (this._pendingTracks) this._state.notice = PACE_CHANGE_NOTICE;
      this._emit();
    } finally {
      this._committing = false;
    }
  }

  private async _refetchAndLoad(targetBpm: number): Promise<void> {
    if (!this._state) return;
    this._state.isLoadingTracks = true;
    this._emit();

    const tracks = await getRecommendations({
      targetBpm,
      vibe: this._state.vibe,
      settings: this._settings,
    });

    if (!this._state) return;
    this._state.isLoadingTracks = false;
    await this._loadTracks(tracks);
  }

  private async _loadTracks(tracks: MusicTrack[]): Promise<void> {
    if (!this._state) return;
    this._tracks = tracks;
    this._index = 0;
    this._page = 0;
    this._syncTracks();
    this._emit();

    if (tracks.length === 0) return;
    await playQueue(tracks.map((t) => t.id));
    this._state.isPlaying = true;
    this._emit();
  }

  // Swaps in a boundary-deferred queue if one is waiting. Returns whether it did.
  private async _applyPending(): Promise<boolean> {
    if (!this._state || !this._pendingTracks) return false;
    const pending = this._pendingTracks;
    this._pendingTracks = null;
    this._state.notice = null;
    await this._loadTracks(pending);
    return true;
  }

  private _maybeReplenish(): void {
    const remaining = this._tracks.length - 1 - this._index;
    if (remaining <= REPLENISH_THRESHOLD) {
      this._replenish().catch((e) => console.error('[SessionEngine] replenish error:', e));
    }
  }

  private async _replenish(): Promise<void> {
    if (!this._state || this._replenishing || this._tracks.length === 0) return;
    this._replenishing = true;
    try {
      this._page += 1;
      const more = await getRecommendations({
        targetBpm: this._state.managedCadence,
        vibe: this._state.vibe,
        page: this._page,
        settings: this._settings,
      });
      if (!this._state) return;

      const seen = new Set(this._tracks.map((t) => t.id));
      const fresh = more.filter((t) => !seen.has(t.id));
      if (fresh.length === 0) return;

      this._tracks = [...this._tracks, ...fresh];
      this._syncTracks();
      this._emit();

      for (const track of fresh) {
        await queueTrack(track.id);
      }
    } finally {
      this._replenishing = false;
    }
  }

  // Manual pace: set a fixed managed cadence and lock it.
  async setManualPace(spm: number): Promise<void> {
    if (!this._state) return;
    this._paceLocked = true;
    this._pendingTracks = null;
    this._managedSince = null;
    this._state.paceLocked = true;
    this._state.isCalibrating = false;
    this._state.notice = null;
    this._state.managedCadence = spm;
    this._state.perceivedCadence = spm;
    this._smoothedPerceived = spm;
    await this._commitManaged(spm, true);
  }

  setPaceLocked(locked: boolean): void {
    if (!this._state) return;
    this._paceLocked = locked;
    this._state.paceLocked = locked;
    this._managedSince = null;
    this._emit();
  }

  private _onNativeTrackChange(trackId: string): void {
    if (!this._state) return;

    // A pace change is waiting for a boundary, and we just hit one.
    if (this._pendingTracks) {
      this._applyPending().catch((e) => console.error('[SessionEngine] pending swap error:', e));
      return;
    }

    const idx = this._tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) {
      // The system player advanced past our saved queue while backgrounded. Rebuild
      // a matched queue from the current pace so playback re-syncs and replenish resumes.
      if (this._resuming && this._state.managedCadence > 0) {
        this._resuming = false;
        this._refetchAndLoad(this._state.managedCadence).catch((e) =>
          console.error('[SessionEngine] resume recovery refetch error:', e),
        );
      }
      return;
    }
    this._resuming = false;
    if (idx === this._index) return;
    this._index = idx;
    this._state.isPlaying = true;
    this._syncTracks();
    this._emit();
    this._maybeReplenish();
  }

  async togglePlayPause(): Promise<void> {
    if (!this._state) return;
    if (this._state.isPlaying) {
      await pause();
      this._state.isPlaying = false;
    } else {
      await resume();
      this._state.isPlaying = true;
    }
    this._emit();
  }

  async skipNext(): Promise<void> {
    if (!this._state) return;
    if (await this._applyPending()) return;
    if (this._index >= this._tracks.length - 1) return;
    await skipToNext();
    this._index += 1;
    this._state.isPlaying = true;
    this._syncTracks();
    this._emit();
    this._maybeReplenish();
  }

  async skipPrevious(): Promise<void> {
    if (!this._state || this._index <= 0) return;
    await skipToPrevious();
    this._index -= 1;
    this._state.isPlaying = true;
    this._syncTracks();
    this._emit();
  }

  recalibrate(): void {
    if (!this._state) return;
    this._paceLocked = false;
    this._managedSince = null;
    this._pendingTracks = null;
    this._smoothedPerceived = null;
    this._state.paceLocked = false;
    this._state.isCalibrating = true;
    this._state.notice = null;
    this._emit();
    this._detector.recalibrate();
  }

  getState(): SessionState {
    if (!this._state) throw new Error('Session not started');
    return { ...this._state };
  }

  getQueuedTrackIds(): string[] {
    return this._tracks.slice(this._index + 1).map((t) => t.id);
  }

  // Call before stop() to read end-of-session stats.
  getSummary(): SessionSummary {
    const durationSec = this._state
      ? Math.max(0, Math.round((Date.now() - this._state.startedAt) / 1000))
      : 0;
    const avgCadence = this._cadenceCount > 0 ? Math.round(this._cadenceSum / this._cadenceCount) : 0;
    const steps = this._detector.totalSteps();
    const distanceMi = Math.round(((steps * METERS_PER_STEP) / METERS_PER_MILE) * 10) / 10;
    return { durationSec, steps, avgCadence, songsPlayed: this._playedIds.size, distanceMi };
  }

  async stop(): Promise<void> {
    clearPersisted().catch(() => {});
    this._detector.stop();
    this._trackSub?.remove();
    this._trackSub = null;
    await disconnect();
    this._state = null;
    this._tracks = [];
    this._index = 0;
    this._page = 0;
    this._replenishing = false;
    this._committing = false;
    this._resuming = false;
    this._managedSince = null;
    this._pendingTracks = null;
    this._smoothedPerceived = null;
    this._paceLocked = false;
    this._cadenceSum = 0;
    this._cadenceCount = 0;
    this._playedIds = new Set();
  }
}
