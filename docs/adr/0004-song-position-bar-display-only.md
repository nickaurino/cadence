# ADR 0004 — Song-position bar is display-only (no scrubbing)

Status: Accepted — 2026-06-09

## Context

The now-playing track card shows a song-position bar (see CONTEXT.md). The natural
expectation is a scrubber: drag to seek within the song. We prototyped scrubbing.

Cadence drives playback through MusicKit's `SystemMusicPlayer.shared` (queue, skip,
play/pause all go through it). MusicKit exposes **no seek API** — `playbackTime` is
effectively read-only for our purposes. The only seek surface is
`MPMusicPlayerController.systemMusicPlayer.currentPlaybackTime`.

We tried both:

- Setting `SystemMusicPlayer.playbackTime` — the bar snapped back; the set did not
  take.
- Setting `MPMusicPlayerController.systemMusicPlayer.currentPlaybackTime` — verified
  on-device with instrumentation. When the queue is driven through MusicKit, the
  MediaPlayer bridge does not reliably own the now-playing item, so the seek
  no-ops and playback does not move. (Some attempts surfaced
  `MPMusicPlayerControllerErrorDomain error 2`, a queue/playback generation failure.)

Mixing the two player APIs (read via MusicKit, seek via MediaPlayer) also risks
state desync.

## Decision

The song-position bar is **display-only**. It reflects playback position (polled via
MusicKit `playbackTime` + the current song's duration) but does not accept drags.

## Consequences

- No scrub gesture, no `seek` native function, no `PanResponder` on the bar — simpler
  and crash-free (no mid-gesture responder churn).
- On track change the bar blanks and briefly ignores reads so it never flashes the
  previous song's position.
- If a future change moves playback to `ApplicationMusicPlayer` or a fully
  MediaPlayer-driven queue, revisit: a single consistent player might restore
  reliable seeking. Until then, **do not re-attempt seeking the system player** — it
  was investigated and does not work from this setup.
