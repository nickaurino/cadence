# Cadence — Review & Roadmap (2026-06-08)

State: core loop works end to end on device — pedometer → perceived/managed
cadence → BPM-matched Apple Music with half/double-time, settings, guard rails,
auto-replenish, manual pace, playback controls. 56 unit tests green, tsc clean.

## Cleanup done this pass
- Removed dead Spotify token helpers, `MODE_BPM`, `SessionMode`, `CadenceReading`.
- Replaced dead Spotify store tests with match-settings coverage.

## Open issues (prioritized)

1. **Music keeps playing after "End session."** `player.disconnect()` is a no-op and
   `engine.stop()` never pauses the system player. Likely surprising. Fix: pause on stop.
   _(low effort)_
2. **Slow first load.** We analyze ~75 preview clips before the first song plays. The
   biggest UX drag. Options: cap candidate count, limit concurrency, or short-circuit
   once N matches are found. _(medium)_
3. **`end.tsx` ignores the track ids it's handed** — no session summary. Either build one
   or drop the param. _(feature)_
4. **Onboarding overstates the science:** "improves endurance by 15%." Our own research
   supports ~10% lower perceived effort and ~1–3% endurance. Soften for credibility.
   _(copy / brand — Zernell)_
5. **Replenish depth:** high catalog offsets return nothing → queue stops growing. Rare.
6. **Native unverified on device:** `analyzeBpm` accuracy and the now-playing observer
   only validated by use. Watch for missed auto-advances / bad BPMs.
7. **Boundary pending + replenish** can queue old-pace songs onto the player while a swap
   is pending. Minor.

## Feature opportunities (next, by value)

- **A. Session summary** (end screen): duration, average cadence, songs played, estimated
  distance. Uses data we already pass. High value, natural close to the loop.
- **B. Recommendation performance** (issue 2): make the first song arrive fast. Highest
  friction in real use.
- **C. Groove-aware recommendations (v2):** rank within a BPM band by pulse clarity /
  tempo stability / energy — all computable from the preview pipeline we already run
  (see docs/ideas/smart-recommendations-music-science.md). The real differentiator.
- **D. Crossfade / smoother song switch** (softens the immediate-swap abruptness).
- **E. Hero-number decision:** keep perceived (smoothed) as the big number vs promote
  managed. Pending a steady-run feel test.
- **F. Stop-vs-keep-playing on session end** (issue 1, also a product choice).
- **G. Polish:** broaden search on "no songs matched"; auth-lost error states; onboarding
  copy honesty (issue 4).

## Process
- **Commit the work.** A large amount of this session's work (Cadence app + portfolio) is
  uncommitted. Strongly recommend committing/branching before building more — the tree is
  big and at risk.
- Keep the CONTEXT.md + docs/adr pattern for non-trivial decisions.
