# Next Build — Backlog

Living checklist of what goes into the next native TestFlight build. A native
rebuild is required to ship anything in `modules/` (Swift). Bump `buildNumber`
in `app.json` before each upload.

---

## 1. Tempo perceptual prior  ✅ code done, needs native rebuild

`TempoAnalyzer.swift` now weights autocorrelation candidates by a log-Gaussian
centered ~130 BPM before picking the peak, so fast songs stop getting tagged at
half their real tempo. Measured with `tools/tempo-check`:

- before: exact 31%, octave 63%, wrong 6%  (16 songs)
- after:  exact 82%, octave 13%, wrong 5%  (55 songs)

Committed `2a5c04b`. JS reload does NOT pick this up — lands on the next native
build. Re-run `bash tools/tempo-check/run.sh` anytime to re-measure.

## 2. Gait-aware pace assist  ✅ code done (JS), device-verify on next build

`ManualPaceModal` now leads with a Walk/Run toggle:
- **Run** → Easy/Typical/Fast effort chips (165/175/185), one tap.
- **Walk** → mph stepper computing `cadence ≈ 16*mph + 60` (3.0 mph ≈ 108 spm).
- Wheel stays as the exact-number override.

Formula in `src/engine/pace.ts` (+ tests). Height left out per decision (the
walking formula already encodes step length; variance is large). Committed
`7e7c86d`. JS-only, so it reloads on a dev build; still ships in the next build.
Device check pending: confirm the toggle, chips, and mph stepper feel right and
drive the wheel correctly.

---

## Parked / not in this build

- Cross-rhythm tempo errors (Shape of You, Drake "Nonstop"): need real
  beat-grid tracking, out of scope for v1. See `tools/tempo-check`.
- Beat-phase alignment (start song on a beat): ADR 0006, v2 exploration.
