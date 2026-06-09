# Cadence — Domain Context

Glossary of domain terms. Meaningful to anyone reasoning about the product, not
tied to implementation. Keep entries behavioral.

## Cadence terms

- **Perceived cadence** — the live, smoothed steps-per-minute the app reads from
  the pedometer. Updates continuously and responds when you speed up or slow down.
  Smoothed because the raw pedometer rate is twitchy; "perceived" = the rate the
  app perceives moment to moment. Drives the hero number only while you are
  shifting pace (out of the pocket); see Hero number.

- **Managed cadence** — the stable cadence value the song queue is currently
  matched to. Derived from perceived cadence but deliberately lags it: it only
  moves when perceived cadence drifts past a threshold and holds for a sustained
  time (see Pace sensitivity), so the music doesn't re-shuffle every few seconds.
  NOT a goal to reach — it follows you. It is also the value the hero number
  *rests on* while you are in the pocket (see Hero number). (Previously,
  misleadingly, "target cadence" / `targetBpm`.)

- **Pace sensitivity** — user setting for how eagerly managed cadence follows
  perceived cadence. Responsive / Balanced (default) / Relaxed map to a
  (drift threshold, sustain time) pair. Recalibrate is the manual override that
  forces an immediate re-match.

- **Song switching** — user setting for how a managed-cadence change reaches the
  music. "At song end" (default) finishes the current song and swaps the queue at
  the boundary, showing a brief notice ("Pace changed. New songs up next, or skip
  to switch now"). "Immediate" cuts and swaps as soon as the new queue is ready.

- **Tempo (BPM)** — a song's beats per minute. Matched to managed cadence,
  allowing half-time and double-time.

## Matching terms

- **Half/double-time match** — a song matches when its tempo, or 2×, or ½× its
  tempo lands near your cadence. A 90 BPM song fits a 180 spm run at half-time.
  User-toggleable in settings.

- **Pace lock** — user *manually* freezes the managed cadence (treadmill /
  testing); live pace changes stop re-matching the music. Distinct from "in the
  pocket" (below), which is an automatic, momentary state — not a user action.

- **In the pocket** — the natural, automatic state where perceived cadence sits
  within the match window of managed cadence: your steps are landing on the
  tempo the music is matched to. Not a setting and not Pace lock — it comes and
  goes on its own as you run. Drives the active screen's "locked" visual feedback
  (the accent color and any on-beat pulse). You leave the pocket when you shift
  pace and re-enter it once managed catches up.

- **Guard rails** — cadence readings below FLOOR (50 spm) or above CEILING
  (240 spm) are treated as sensor noise: ignored for matching, flagged to the user.

## UI terms

- **Hero number** — the single large cadence readout on the active screen. It
  *rests on managed cadence while you are in the pocket* (rock-steady, equal to
  what the music is matched to, so it never falsely implies a song change), and
  switches to live perceived cadence while you are shifting pace, then re-settles
  onto managed once you are back in the pocket. The small "Matching N" chip below
  it shows managed during a shift — i.e. exactly when the hero has gone live and
  the two values differ.
