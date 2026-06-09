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
  music. "Immediate" (default) cuts and swaps as soon as the new queue is ready.
  "At song end" finishes the current song and swaps the queue at the boundary,
  showing a brief notice ("Pace changed. New songs up next, or skip to switch now").

- **Tempo (BPM)** — a song's beats per minute. Matched to managed cadence,
  allowing half-time and double-time.

## Onboarding terms

- **Onboarding** — the first-run flow shown once before the app proper. Two
  framing screens (the honest ~10%-less-perceived-effort payoff, then the
  entrainment mechanism), then two permission primers (motion, then Apple Music),
  then a handoff straight into the first session. Ends at the first match, not on
  a cold home screen. Gated by `hasCompletedOnboarding()` / `markOnboardingComplete()`.

- **Permission primer** — a screen shown in onboarding to set up a permission.
  - **Apple Music** (MusicKit — playback): a real why-first primer with a
    Connect button and a "continue without" fallback (pace detection still works).
    Always shown (no auto-skip — MusicKit's authorization status lags the iOS
    toggle, so auto-skipping wrongly hid it); an already-authorized user just taps
    Connect and it resolves instantly.
  - **Motion** (CMPedometer): an *informational heads-up* only, no Allow button.
    iOS won't reliably let an app re-prompt once motion is decided
    (`canAskAgain:false`) and its status API misreports, so the slide just sets
    expectations ("we'll ask when you start"). The OS prompt fires when the first
    session reads steps; denial is handled by the in-app **no-motion state**.

- **No-motion state** — the active-screen state when the pedometer is unavailable
  (motion denied, revoked, or unsupported). Matching can't auto-follow, so instead
  of silently spinning in "Finding your pace" the screen shows a recoverable
  message with two paths: enable Motion in iOS Settings, or set your own pace
  (manual pace / pace lock, which runs without the pedometer). The music-at-your-
  tempo core still works in manual mode; only the "on the beat" feedback is absent.
  - **Detection:** readability is probed via `getStepCountAsync` (resolves when
    motion is readable, throws when truly denied), NOT `getPermissionsAsync` —
    the latter misreports `denied` even when Motion & Fitness is enabled. Once the
    user picks a manual pace, the screen won't re-trap them (recalibrate, which
    clears the lock, is hidden when motion is unavailable).

- **First match** — the aha moment onboarding aims for: the first time the music
  tempo visibly locks to the user's live cadence (first time "on the beat" / in
  the pocket). The whole first run is a runway to it.

- **Feature tour** — the set of contextual coachmarks that teach the core concepts
  the first time they become relevant, rather than up front. Four of them:
  on-the-beat (the aha), the "Matching N" shift, pace lock, and hold-to-end. They
  are **independent and one-time**, not a linear sequence: each fires in whatever
  session its trigger first occurs and is marked seen individually, so a user who
  never shifts pace early still gets that coachmark whenever they first do. "Skip
  tour" marks all remaining seen; the tour is re-triggerable from Settings. Ends
  with a Settings handoff ("good defaults, all tunable in Settings") after the last
  coachmark is seen. Mechanism borrowed from the hobby-randomizer spotlight
  (measured cutout); see ADR 0005.

- **Coachmark** — one coachmark of the feature tour: a dimmed overlay with a cutout
  around a real, measured on-screen element plus a short instruction. Shows once
  (gated on its trigger and an unseen flag), dismissed by the relevant real action
  or a tap.

- **Reset app** — a Settings action that clears onboarding + feature-tour state so
  both replay on next launch, and deep-links to iOS Settings for revoking Motion /
  Apple Music access (an app cannot revoke its own OS permissions). For testing and
  for users who want a clean slate.

## Product principles

- **Honesty firewall** — every user-facing claim must pass an evidence check before
  it ships. Two rules: (1) **Performance/science claims** stay within graded
  evidence (`docs/ideas/smart-recommendations-music-science.md`) and are attributed
  + hedged, never flattened. Permitted: "~10% lower perceived effort, in studies."
  Banned: "+15% endurance," "run longer," any bare stat. (2) **State claims** never
  assert something the app can't verify in the moment, e.g. don't tell a motionless
  manual-pace user "your steps are landing on the beat" (the on-beat coachmark is
  gated on real detected cadence, not a manual lock). Origin: the prep agenda's
  honesty rule + the music-science grading doc, formalized in
  `docs/design-research/06-onboarding-psychology.md` §5.

## Matching terms

- **Half/double-time match** — a song matches when its tempo, or 2×, or ½× its
  tempo lands near your cadence. A 90 BPM song fits a 180 spm run at half-time.
  User-toggleable in settings.

- **Pace lock** — user *manually* freezes the managed cadence (treadmill /
  testing); live pace changes stop re-matching the music. One concept with two
  entry points: the **lock control** (freeze at your current pace) and the
  **manual-pace wheel** (freeze at a value you dial in). Either way the screen
  reads as "locked"; unlocking resumes auto-follow. Distinct from "in the pocket"
  (below), which is an automatic, momentary state — not a user action.

- **Manual pace** — engaging Pace lock at a value you choose via the pace wheel,
  rather than at your current detected pace. It is an entry point to Pace lock,
  not a separate mode.

- **In the pocket** — the natural, automatic state where perceived cadence sits
  within the match window of managed cadence: your steps are landing on the
  tempo the music is matched to. Not a setting and not Pace lock — it comes and
  goes on its own as you run. Drives the active screen's "locked" visual feedback
  (the accent color and any on-beat pulse). You leave the pocket when you shift
  pace and re-enter it once managed catches up.
  - **Internal vs user-facing wording:** "in the pocket" is the *domain* term
    (used in code, engine state `inThePocket`, and these docs). It is a
    musician's phrase and tested as ambiguous with first-time users (read as
    "phone in pocket"). User-facing copy therefore avoids it: the active-screen
    status reads **"On the beat"** (not "Locked in", which collides with the
    "Pace locked" status), and onboarding/tour copy teaches the felt thing
    ("your steps are landing right on the beat") rather than the jargon.

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

- **In-the-pocket ring** — an arc/ring around the hero number that reflects how
  locked your steps are to the matched tempo: present/pulsing when in the pocket,
  receding while you shift pace. Communicates *match quality*, not session
  progress.

- **Song-position bar** — a thin, **display-only** indicator on the now-playing
  track card showing playback position within the current song. Not scrubbable:
  the system Music player cannot be reliably seeked (see ADR 0004), so it reflects
  position but does not accept drags. This is the only literal progress
  bar in the app. There is deliberately **no session-progress bar**: a session is
  open-ended (you run until End), so there is no goal to fill toward. Elapsed
  duration is shown in the end-of-session summary, not live on the active screen.

- **End session** — the explicit terminator. Stops the music, clears the saved
  session so it will not auto-resume (see Session resume), and shows the
  end-of-session summary. Engaged by **hold-to-end** (press and hold ~1.5s with a
  filling-ring animation) to prevent accidental mid-run taps. The only thing that
  ends a session; backgrounding or killing the app does not.

- **Session resume** — a session survives the app being backgrounded or killed and
  picks back up automatically on reopen (music kept playing via the system
  player). Only End session truly ends it; an abandoned session older than a few
  hours is discarded rather than resumed. (See ADR-tracked background-sessions work.)
