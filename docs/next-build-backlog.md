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

## 2. Gait-aware pace assist  🔲 proposed (design below)

Problem: "Set pace" asks for steps-per-minute, but nobody knows their SPM.
Pull from `docs/ideas/session-controls-backlog.md` research:

- Running cadence is near-constant across speed → mph is a poor proxy for
  runners. Effort, not speed, is the right input.
- Walking cadence DOES track speed → **cadence ≈ 16 × mph + 60** (walking only).
- Height adds little beyond the walking formula; not worth the friction.

Proposed addition to `ManualPaceModal`:

- A small **Walk / Run** toggle above the wheel.
- **Run** → three effort chips (Easy ~165 / Typical ~175 / Fast ~185) that set
  the wheel with one tap. (Anchors already exist as labels; make them tappable.)
- **Walk** → an mph stepper (~2.0–4.5) that live-computes spm via `16*mph+60`
  and sets the wheel.
- The wheel stays as the exact-number override for anyone who does know.

Honesty: present estimates as a starting point ("we'll get you close, adjust if
it feels off"), never as a measured personal cadence.

Open question for Nick: include height as an optional refinement, or leave it
out (recommended)?

---

## Parked / not in this build

- Cross-rhythm tempo errors (Shape of You, Drake "Nonstop"): need real
  beat-grid tracking, out of scope for v1. See `tools/tempo-check`.
- Beat-phase alignment (start song on a beat): ADR 0006, v2 exploration.
