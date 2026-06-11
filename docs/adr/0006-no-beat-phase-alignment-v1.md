# ADR 0006: No beat-phase alignment in v1 (tempo match, not phase lock)

Date: 2026-06-10
Status: accepted

## Context

Feature idea (Nick, pre-v1 review): when a song starts, start it ON a beat that
lines up with the user's footfalls, instead of at second 0 with the user left to
adjust. Investigated and deferred.

## Why it can't ship on the current architecture

1. **No seek.** Starting playback at a chosen beat offset requires seeking the
   player to a precise position. The system Apple Music player ignores seeks —
   device-proven twice (MusicKit `playbackTime` and
   `MPMusicPlayerController.currentPlaybackTime`); this is why the song-position
   bar is display-only (ADR 0004).
2. **No beat grid.** We estimate one global BPM per song from its 30s preview
   (TempoAnalyzer). Phase alignment needs per-beat onset timestamps for the FULL
   track, which we don't have and can't compute (full tracks are DRM-protected).
3. **Unpredictable start latency.** Apple Music playback starts with 0.5-2s of
   buffering jitter, larger than a beat period — even a perfect seek would land
   off-phase.
4. **Drift makes it moot.** We match within a tolerance (e.g. a 142 spm stride
   to a 140 BPM song), so step and beat phase drift apart within ~15s regardless
   of how the song starts. Products that truly locked beat to stride (Spotify
   Running, RockMyRun) ran their own audio pipelines with TIME-STRETCHING so the
   song's tempo continuously follows the runner. That is the only honest version
   of this feature.

## Decision

v1 ships tempo matching ("in the pocket"), not phase lock. The v2-scale path,
if ever: an in-app playback pipeline (ApplicationMusicPlayer or AVAudioEngine)
with real-time time-stretch locked to live cadence — a product-defining rebuild,
not an increment. Roadmap carries it as an exploration item.

## Related

- ADR 0004 (song-position bar display-only — the seek evidence)
- ADR 0001 (cadence measurement); `src/engine/smoothing.ts` (the v1 answer to
  "make the beat easier to track": a steady displayed number + steady ring)
