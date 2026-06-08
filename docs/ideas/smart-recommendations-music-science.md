# Idea: science-informed song recommendations (LATER feature)

**Status:** parked / research phase. Not for now. Captured 2026-06-07.

## The pitch
Today Cadence matches songs to your step rate by **BPM only** (with half/double-time).
Idea: go beyond raw tempo — recommend songs using what's known about how music
affects movement and the brain, à la Pandora's "Music Genome" approach. Make the
queue feel *right* for running, not just on-tempo.

## What "Pandora neuroscience of music" likely refers to
- **Pandora = the Music Genome Project**: songs hand-analyzed by trained musicologists
  across ~450 musical attributes, used to recommend similar music. Worth noting: this
  is applied **musicology / feature-tagging**, not literally neuroscience. (Agents to confirm.)
- **The real neuroscience** that matters for a fitness app is separate: rhythmic
  entrainment, "groove," beat perception, tempo's effect on perceived exertion and
  performance (Karageorghis et al.), dopamine/reward. (Agents to confirm + grade evidence.)

## Why it could matter for Cadence
Two songs at the same BPM can feel totally different to run to. Signals beyond BPM that
*might* improve matching: groove / rhythmic stability (pulse clarity), energy,
danceability, valence/mood, key. If real and obtainable, this is a v2 "smart queue."

## Open questions (for the research agents)
1. Is the phenomenon real and well-supported, or marketing? Evidence strength.
2. Is any Pandora/Music-Genome data accessible via API, or fully proprietary?
3. Which extra signals are worth it, and how do we obtain them — Apple Music catalog
   attributes? our existing on-device audio analysis? open datasets (AcousticBrainz)?
   (Spotify audio-features API is deprecated for new apps.)
4. Concrete, prioritized feature recommendations: quick wins vs later.

## Research findings
_Pending — two background agents dispatched 2026-06-07. Fill in on completion._

### Agent 1 — Is it real? (Pandora Music Genome + music-movement neuroscience) ✅ 2026-06-07

**Pandora MGP:** human musicologists tag ~450 "genes" per song (~20–30 min/track); recs = similarity in attribute-space. **It is applied musicology + feature engineering, NOT neuroscience** — zero brain-mechanism claims. **No public API** (closed/proprietary). Movement-relevant subset (BPM, beat strength, danceability, energy) is approximable via alternatives: Spotify audio-features (deprecated for new apps — unreliable), AcousticBrainz/Essentia (free, patchy, frozen ~2022), or paid (Cyanite, Reccobeats, Musixmatch), or compute ourselves.

**Neuroscience, graded:**
- **STRONG** — Auditory–motor entrainment / sensorimotor sync: bodies involuntarily lock movement to a beat (SMA, basal ganglia, cerebellum). The bedrock our app already exploits.
- **STRONG (clinical) / MODERATE (runners)** — RAS: match beat to cadence then shift ±5–10% to drive gait. Directly analogous to our cadence targeting.
- **MODERATE** — Running cadence spontaneously drifts toward music BPM (Van Dyck 2015, 2018), but coupling is individual and breaks on big mismatches.
- **MODERATE, replicated (Karageorghis)** — synchronous music ↓ RPE ~10% and ↑ endurance ~1–3% at low–moderate intensity; benefit shrinks near max; ~125–140 BPM most motivational.
- **MODERATE** — **Groove** (Witek 2014): inverted-U, *medium* syncopation + clear pulse maximizes urge-to-move. **Strongest case for going beyond raw BPM** — two 160-BPM songs differ hugely in how much they make you run.
- **STRONG it occurs / WEAK as a fitness lever** — music-dopamine "chills" (Salimpoor/Zatorre 2011) is real but measured at peak-pleasure listening, not exercise. Use for enjoyment/adherence framing, NOT performance claims.

**Bottom line:** Real, harnessable phenomenon beyond tempo — entrainment + groove are genuine brain-level effects, and beat *quality* (pulse clarity, moderate syncopation, danceability) changes movement pull in ways BPM misses. Honest feature = **"BPM + groove/energy-aware" ranking**: match cadence first, then rank within the BPM band by movement-inducing attributes. Don't overclaim dopamine/neuro performance; keep perf claims to Karageorghis's modest ~1–3% / ~10% RPE. Pandora MGP is closed + not neuroscience — don't lean on it.

### Agent 2 — Can we harness it for Cadence? ✅ 2026-06-07

**Headline: the biggest wins are computable from the 30s preview we ALREADY analyze.** Apple's catalog exposes no audio features; AcousticBrainz is frozen (2022) and sparse. So compute on-device, don't depend on external data.

**Signals, ranked by value for running:**
- **Pulse clarity / beat strength — HIGH.** Best differentiator after BPM. Two 170-BPM songs aren't equal; a weak/sparse pulse won't lock the runner. **Cheap:** = prominence of the dominant autocorrelation peak (we already compute the autocorr for tempo).
- **Tempo stability — HIGH.** Entrainment needs near-constant tempo; drift/breakdowns break the lock. **Cheap:** variance of peak-lag across overlapping windows / peak sharpness. Reuses existing buffers.
- **Energy (RMS + low-band spectral energy) — MED-HIGH.** Matters for intensity matching + warmup/cooldown sequencing (ceiling: music stops cutting RPE above ~75% effort). **Cheap:** vDSP RMS + band energy from FFTs we already run.
- **Onset density — MED.** Free byproduct of the onset detector; feeds groove/energy composite.
- **Spectral centroid (brightness) — LOW-MED.** Nearly free tie-breaker.
- **Valence/mood — MED personalization, LOW sync.** Needs a model; lower ROI.
- **Musical key — LOW.** Only if we ever build beatmatched crossfades.

**Data sources verdict:** (a) MusicKit catalog = genre + ISRC + duration only, no audio features. (b) **On-device from preview = the path** (we have the vDSP pipeline; these are near-free add-ons). (c) AcousticBrainz via ISRC→MBID = optional offline backfill only, never runtime (frozen/sparse). Cache all derived features by catalog ID/ISRC — analyze each track once.

**Top 3 next steps (when we build it):**
1. Add **pulse-clarity + tempo-stability** scoring to the existing onset/autocorrelation stage (peak prominence + windowed peak-lag variance).
2. Add an **energy score** (RMS + low-band spectral energy + onset density) from the same buffers/FFTs; cache per track.
3. Replace BPM-only ranking with a **composite score**: BPM fit stays the hard gate (keep ±6% + half/double), then rank survivors by weighted pulse-clarity + tempo-stability + energy-fit. Ship fixed weights; instrument skips/completions to tune (later personalize).

## Recommended direction (synthesis)
Build **"BPM + groove-aware" ranking**, entirely on-device, reusing the TempoAnalyzer pipeline. BPM match = gate (already built); the new value is ranking *within* the band by **pulse clarity + tempo stability + energy** — the signals that decide whether a runner actually entrains. No new APIs, no Pandora, no paid data. Frame benefits honestly: better *feel* + enjoyment/adherence; keep performance claims to the modest, evidence-backed range. This is a clean v2 once the core playback loop is proven.
