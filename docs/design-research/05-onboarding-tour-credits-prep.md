# Onboarding + Feature Tour + Credits — Prep Agenda (next session)

Status: PREP. No code until the prep below is done and a growth-docs session
settles the design. Captured 2026-06-09.

Nick's framing: this needs a lot of prep before any code. Two prep tracks first
(psychology, then a Dabble teardown), then a **growth-docs session** to settle the
design, then spec → plan → build.

## Goal

Three connected pieces:
1. **Onboarding** — the first-run flow (currently `app/onboarding/{index,connect,how-it-works}.tsx`, basic + only color-reskinned, NOT redesigned).
2. **Feature tour** — an in-app guided tour of the app's features (likely post-onboarding or first-session coachmarks).
3. **Credits** — a credits screen (collaborator Zernell; cf. the portfolio Credits page that was built then pulled). Decide placement (settings → About? a dedicated screen?).

## Prep track 1 — Psychology (research first)

Research and write up the psychology that should drive the design. Topics:
- Activation & **time-to-value** / the "aha moment" — get the user to the core loop
  (steps → matched music) as fast as possible; minimize first-run friction.
- **Progressive disclosure** — don't dump everything; reveal features in context.
- **Permission priming** — motion (CMPedometer) + Apple Music auth: prime *why*
  before the system prompt (pre-permission screens lift grant rates).
- Motivation: self-determination (autonomy/competence), **endowed progress** /
  Zeigarnik (a partially-filled progress bar pulls people to finish onboarding).
- Honesty: keep claims to the evidence-backed range (no "+15% endurance" — see
  `docs/ideas/smart-recommendations-music-science.md` grading).
- Retention hooks without dark patterns.
Cite sources (NN/g, Reforge/Growth, Duolingo/onboarding case studies, Karageorghis
for the exertion/music claims).

## Prep track 2 — Dabble teardown

Dabble (Nick's other app) did a **phenomenal** onboarding + feature tour. Study it
and pull patterns. Capture concretely:
- Flow & pacing (how many steps, what order, when permissions are asked).
- Copy tone and length.
- Visual style (how it used color/motion; what made it feel premium).
- The feature-tour mechanism (coachmarks? interactive? skippable?).
- What specifically to borrow vs. adapt for Cadence's Onyx+Marigold system.
(Nick to provide Dabble access/screens, or describe it, during the growth-docs session.)

## Prep track 3 — Growth-docs session

A structured grill-with-docs/brainstorming session to settle:
- The onboarding flow (screens, order, copy, permission priming).
- The feature-tour mechanism and which features to surface.
- Credits scope + placement.
- Ubiquitous language for onboarding/tour terms (add to CONTEXT.md).
Output: a spec in `docs/superpowers/specs/`, then a plan, then build.

## Constraints / notes

- Visual system is locked: Onyx base + Marigold accent (ADR 0003), the ring motif,
  `PressableScale`, `SettingsButton`, `SafeAreaView` (bottom edge on centered screens).
- Onboarding gate already exists: `hasCompletedOnboarding()` / `markOnboardingComplete()`
  in `src/storage/store.ts`; `app/index.tsx` routes first-run → `/onboarding`.
- Keep motion safe: one animation driver per view (see CadenceRing/PressableScale notes).

## Sequence

1. Psychology research doc → `docs/design-research/06-onboarding-psychology.md`.
2. Dabble teardown doc → `docs/design-research/07-dabble-teardown.md`.
3. Growth-docs session → spec.
4. Plan → build (onboarding, then tour, then credits).
