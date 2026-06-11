# Cadence — Review & Roadmap (2026-06-09)

State: full app working on device — pedometer → perceived/managed cadence →
groove-aware BPM-matched Apple Music, background-resilient sessions, and a complete
Onyx + Marigold visual revamp. 99 unit tests green, tsc clean. All on `main` (local,
unpushed).

## Done (recent)

- Groove-aware ranking v2 (pulse clarity + tempo stability).
- Background-resilient sessions (persist + auto-resume + recovery).
- Visual system locked: Onyx `#0c0c0d` + Marigold `#EFA836` (ADR 0003); cream hint.
- Active screen redesign: `CadenceRing`, in-the-pocket hero (ADR 0002), `HoldToEnd`
  (gold full-length fill + haptics), reserved message slot, tight centered layout.
- Home / vibe-selector / end / settings redesigned. Shared components
  (`PressableScale`, `SettingsButton`).
- Default song switching → immediate; manual-pace wheel fixed.

## Next big thing: onboarding + feature tour + credits

PREP-heavy. See `docs/design-research/05-onboarding-tour-credits-prep.md`:
psychology research → Dabble teardown → growth-docs session → spec → plan → build.

## Open / parked (prioritized)

1. **In-the-pocket sensitivity** — tune after a real **treadmill test** (it's hard
   to lock onto the beat; don't guess at home). Touches `SENSITIVITY_PRESETS` and the
   `_computeCloseness` band.
2. **Song progress bar** — needs native playback-position support (expose
   position+duration from the player, poll it) + a rebuild. Currently absent.
3. **Haptic rebuild** — `expo-haptics` installed; one native rebuild lights up the
   hold-to-end buzz.
4. **Layout mount-glitch** — fixed twice (initialWindowMetrics; then top safe-area
   edge dropped on centered screens). If it recurs, diagnose the navigation
   transition properly — no more patch-guesses.
5. **Push to GitHub** — `main` is ~40 commits ahead of `origin` (public repo).
6. **Settings toggles** — if the native `Switch` animation still reads as "too much,"
   build a calmer custom toggle.
7. **Native on-chip cadence (v1.x)** — expose `CMPedometer.currentCadence` from the
   native module as a steadier raw signal under `src/engine/smoothing.ts`.
8. **Beat-phase lock (v2 exploration)** — true step-on-the-beat needs an in-app
   audio pipeline with time-stretching; deferred with full reasoning in ADR 0006.

## Process notes
- Animations: one driver per view (see CadenceRing/PressableScale).
- Device-only failures (native rejections, animation drivers) pass tsc+jest — audit
  by hand; reload on device is the real test.
- Keep CONTEXT.md + docs/adr current for non-trivial decisions.
