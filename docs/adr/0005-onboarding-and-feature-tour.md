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

1. **Onboarding hands off to the guided tour** (revised 2026-06-09; originally
   "ends at the first match"). Flow: two framing screens (honest ~10%
   perceived-effort payoff → entrainment mechanism) → **motion primer** (the
   Allow button issues a real step query, which is what actually fires the iOS
   Motion dialog) → **Apple Music primer** (gentle subscription disclaimer +
   "continue without" fallback, always shown) → completing it marks onboarding
   done, arms the tour, and lands on **home**, where the tour immediately
   spotlights Start and guides the user into their first session.
   - **Motion** gets an informational heads-up, not an Allow button: iOS won't
     reliably let an app re-prompt once motion is decided (`canAskAgain:false`),
     so the slide sets expectations and the OS prompt fires when the first session
     reads steps. Denial is handled by the in-app **no-motion state**.
   - **Motion readability** is probed via `getStepCountAsync` (resolves =
     readable, throws = denied), NOT `getPermissionsAsync`, which misreports
     `denied` even when Motion & Fitness is enabled in Settings (confirmed on
     device — it was blocking working sessions). The probe matches what
     `seedFromHistory` already relies on.
   - **Both onboarding permission screens always render** (no auto-skip on a
     cached status): MusicKit's `isAuthorized` and the motion status API both lag
     the iOS toggle, so auto-skip wrongly hid the screens. Already-granted users
     just tap through.

2. **The feature tour is a scripted, Dabble-style guided walkthrough** (REVISED
   2026-06-09, superseding the engine-triggered coachmark model): a fixed step
   sequence across home → setup → active (Start → vibes → Let's go → hero ring →
   song card → pace lock → hold-to-end → Settings handoff), driven by
   `src/tour/script.ts`. It runs when a persisted `tour_enabled` ("pending") flag
   is armed — by onboarding completion or Replay tour — starting from the home
   screen; finishing or skipping disarms it, so it never leaks into ordinary
   sessions. At the session step the user chooses **real** (engine + music live
   underneath) or **simulated** ("just show me around": canned `SessionState`,
   no engine/pedometer/music) — both converge on the same walkthrough. Every
   step shows Skip.

   *Why the revision:* the original model fired each coachmark on live engine
   triggers (first real on-beat moment, first pace shift). Device testing showed
   it was effectively untestable indoors (the aha trigger needs real walking with
   matched music) and invisible to users who don't move much, and partially-fired
   coachmarks leaked into later sessions. The scripted tour is deterministic,
   desk-testable, and matches the hobby-randomizer pattern the teardown
   recommended.

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
