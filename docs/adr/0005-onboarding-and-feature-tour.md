# ADR 0005 — Onboarding flows into a guided first session; tour is in-session coachmarks

Status: Accepted — 2026-06-09

## Context

The original onboarding was three teaching screens ending on a cold home screen,
with one screen making unsupported performance claims ("reduces perceived effort
by 10% and improves endurance by 15%"). Motion permission was never primed — the
CMPedometer prompt fired lazily on first session. There was no feature tour.

Prep research (`docs/design-research/06-onboarding-psychology.md`,
`07-dabble-teardown.md`) and a growth-docs session settled a redesign. Key forces:

- **Time-to-value / aha-first** — the core value (music locking to live cadence,
  "on the beat") should arrive fast and be the climax of the first run, not be
  deferred to a session the user may never start.
- **Permission grant rates** — why-first primers before the native prompt lift
  grants; both motion and Apple Music need one, fired at the relevant moment.
- **Progressive disclosure** — teach concepts contextually, not in an up-front
  dump.
- **Honesty** — copy must stay within graded evidence
  (`docs/ideas/smart-recommendations-music-science.md`): ~10% lower perceived
  effort is replicated and keepable (attributed/hedged); the "15% endurance"
  claim is unsupported (real replicated figure ~1–3%) and is removed.
- A proven local pattern exists: the hobby-randomizer ("Dabble") interactive
  **spotlight tour** — a measured-cutout overlay with action-gated advance, no new
  dependencies.

## Decision

1. **Onboarding ends at the first match, not on home.** Flow: two framing screens
   (honest ~10% perceived-effort payoff → entrainment mechanism) → Apple Music
   primer (with a gentle subscription disclaimer + "continue without" fallback) →
   straight into a first guided session. **Motion has no onboarding primer**
   (revised 2026-06-09): it was redundant with the in-app no-motion state and read
   as a near-duplicate screen. The OS Motion prompt fires lazily on the first
   session; if denied (or unavailable), the active screen shows the recoverable
   **no-motion state** (enable in Settings, or set your own pace via manual pace,
   which runs without the pedometer) instead of spinning in "Finding your pace."
   The no-motion gate only triggers on a definite negative (no hardware or explicit
   `denied`) — iOS pedometer authorization reads unreliably, so granted/
   undetermined never wrongly block a session.

2. **The feature tour is four independent, one-time contextual coachmarks**, each
   gated on `(its own trigger) AND (not yet seen)` and persisted individually,
   not a linear session-bound sequence. Scope: on-the-beat (the aha, gated on a
   matched track actually playing, not just `inThePocket`), the "Matching N" pace
   shift, pace lock, hold-to-end. They fire across whatever sessions their
   triggers occur in, so a never-shift user still gets the shift coachmark later;
   session resume can't re-fire a seen one. "Skip tour" marks all remaining seen;
   the Settings handoff card shows after the last is seen. Re-triggerable from
   Settings (clears all four flags).

3. **Mechanism is ported from the hobby-randomizer spotlight** (`SpotlightOverlay`
   4-panel cutout, `TourContext` step machine, module-level setter shims for
   prop-drill-free replay), re-themed to Onyx + Marigold. No new dependencies.

4. **User-facing copy avoids the "in the pocket" jargon** (tested ambiguous —
   read as "phone in pocket"); the status reads "On the beat" and the tour teaches
   the felt thing. The domain term stays internal (see CONTEXT.md).

5. **"Reset app" in Settings** clears onboarding + tour state and deep-links to iOS
   Settings for permission revocation (the OS does not let an app revoke its own
   grants).

## Consequences

- Each screen that hosts a coachmark target needs minor tour-awareness (a ref +
  measurement), per the spotlight pattern.
- The first session is part of onboarding, so its start must be reachable without
  the user hunting for it.
- Onboarding copy is now gated by the music-science grading doc; new claims must be
  checked against it.
- Reverting to a "tour after onboarding on home" model is possible but would lose
  the aha-first continuity; the coachmark machinery is reusable either way.
