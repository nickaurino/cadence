# ADR 0002: Active-screen hero number rests on managed cadence

Status: Accepted (2026-06-08)

Refines ADR 0001, which called perceived cadence "the hero number." That is now
qualified: perceived drives the hero only while the user is shifting pace.

## Context

The active screen surfaces two cadence values (see CONTEXT.md): **perceived**
(live, updates ~1×/s, smoothed but still visibly twitchy) and **managed** (stable,
lags, and is the *only* value that actually re-matches the music).

Showing live perceived as a giant hero number created two real problems, confirmed
in use:

1. **Twitch / stress.** A number that jumps every second reads as inaccurate and
   is uncomfortable to watch mid-run.
2. **False alarm.** Users brace for a song change every time the big number moves —
   but music is driven by *managed*, which only moves on sustained drift. The
   display implied a coupling that does not exist.

The long-open "hero number" question (perceived vs managed vs one number) had been
deferred in CONTEXT.md's UI note.

## Decision

The **hero number** is a single large readout with two display modes tied to
whether the runner is **in the pocket** (perceived within the match window of
managed):

- **In the pocket (steady):** the hero *rests on managed cadence* — rock-steady,
  exactly equal to what the music is matched to. What you see is what is driving
  playback, so it can never falsely imply a song change.
- **Shifting pace (out of the pocket):** the hero shows live **perceived**
  cadence, climbing/falling with your steps. The small **"Matching N"** chip below
  shows managed during this window — i.e. precisely when the two values differ and
  the user wants to know "the music hasn't switched yet."
- It re-settles onto managed once managed catches up and you are back in the pocket.

Colour reinforces the state: accent (Ember Coral) and any on-beat pulse when in the
pocket; desaturated toward muted brown while shifting.

This keeps both concepts visible (managed is the resting hero; perceived appears
when it matters) without a permanent two-number layout, and it converts the
perceived/managed lag from a confusing artifact into the screen's core feedback
loop.

## Consequences

- The engine must expose enough state for the screen to know "in the pocket vs
  shifting" — essentially whether perceived is within the match window of managed.
  This is derivable from existing values; no new sensing.
- "Hero number" and "in the pocket" are now domain terms (CONTEXT.md). "In the
  pocket" is deliberately distinct from **Pace lock** (the manual freeze).
- Reversible: this is display logic over existing values. If testing shows users
  want a constant live readout, we can revert to always-perceived without touching
  matching.
- Trade-off accepted: while in the pocket the hero equals managed, so a user
  staring at it during a steady run sees a number that "doesn't move much." That is
  the intended calm; the live feel returns the moment they change pace.
