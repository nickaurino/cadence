# ADR 0001: Cadence measurement and music re-matching

Status: Accepted (2026-06-08)

## Context

The session pedometer (`expo-sensors` → `CMPedometer.startUpdates(from:)`) reports
`numberOfSteps` as a **cumulative count since the subscription started** — it never
resets. The original `CadenceDetector` computed `cadence = steps / windowSeconds × 60`
and reset `windowSeconds` every 10s **without re-baselining `steps`**. Consequences,
observed on device:

- Early in a session it effectively reported the **average cadence since start**, so
  speeding up barely moved the number.
- `recalibrate()` reset only a JS timestamp, not the cumulative count, so the next
  reading was `bigCumulativeSteps ÷ tinyWindow` → **2000+ spm spikes**.

Updates arrive ~1×/second while moving and **pause when stationary** (no zero event).

## Decision

Two concepts, split apart (see CONTEXT.md):

- **Perceived cadence** — live, smoothed steps/min; the hero number.
- **Managed cadence** — the stable value the song queue is matched to.

**Detector (`src/sensors/cadence.ts`):**
- Keep a buffer of `(time, cumulativeSteps)` samples and recompute on a self-driven
  ~1s tick (not only on pedometer events).
- `perceived cadence = steps in the last WINDOW seconds ÷ WINDOW × 60`, **WINDOW = 8s**.
  Deltas cancel the cumulative offset (kills the bug); old steps aging out make it
  **decay to 0 when stopped** (honest, no frozen number).
- `recalibrate()` clears the buffer (genuinely fresh; no reliance on resetting the
  uncontrollable cumulative count).

**Engine (`src/engine/session.ts`)** owns re-matching, moved out of the detector:
- Update displayed perceived cadence live.
- Move **managed cadence** to perceived only when perceived drifts past a
  **threshold** and holds for a **sustain** time. Tunable via **Pace sensitivity**
  (Responsive 10/8s · Balanced 12/12s default · Relaxed 16/20s).
- Keep guard rails: ignore readings < FLOOR (50) or > CEILING (240), flag them.
- **Song switching** setting: "At song end" (default) defers the queue swap to the
  next track boundary (auto-advance) with a notice; "Immediate" swaps as soon as the
  new queue is ready. Recalibrate forces an immediate re-match.

## Consequences

- Perceived cadence is accurate and responsive; recalibrate no longer spikes.
- Re-fetch (expensive: ~75 preview analyses) fires only on sustained, real pace
  changes — fewer interruptions.
- "At song end" default can leave you up to one song off-pace after a gear change;
  the notice + skip mitigate, and it's user-overridable.
- Detector now owns a timer (must be cleared on stop to avoid leaks).

## Alternatives rejected

- **Lock-and-threshold in the detector** (original): conflated display and re-fetch,
  and the cumulative-steps math was unfixable without re-baselining.
- **Stop/restart the subscription on recalibrate** to zero the count: racy, drops
  data, and unnecessary once deltas are used.
- **Show a frozen number when stopped**: lies about what the user is doing.
