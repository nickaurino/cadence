# Session controls backlog

Requested 2026-06-07, right after first successful end-to-end run (music played, matched to cadence).

## 1. Lock pace button ✅ DONE 2026-06-07
Toggle freezes the target BPM so the queue stops re-fetching when cadence drifts. Cadence
still shows live. Engine `setPaceLocked()` + `paceLocked` state + UI toggle.

## 2. Playback controls ✅ DONE 2026-06-07
Previous / play-pause / skip on the session screen. Native `pause`/`resume` added; skip &
previous are engine-driven over our own matched queue (with play history for previous).

## 3. Manual pace entry ✅ DONE 2026-06-08 (as cadence picker, NOT MPH)
Research verdict: running cadence is near-constant across speeds, so MPH is a poor proxy and
height isn't worth asking. Built `src/components/ManualPaceModal.tsx` = effort presets
(Easy 165 / Steady 172 / Tempo 178 / Hard 183 spm) + exact-spm override. Engine
`setManualPace(spm)` locks the pace and fetches. (If we ever want MPH for WALKING only:
cadence ≈ 16×mph + 60.)

## Flow changes ✅ DONE 2026-06-08
- Removed the walking/running step. Setup is just vibe → Let's go (no `mode` anywhere).
- **Calibrate-first:** session no longer auto-plays. It waits for movement (or manual pace),
  then fetches songs matched to the detected rhythm. Also fixes the slow load after Let's go
  (screen loads instantly into "Finding your pace", with a "Finding songs…" state after).
- Em dashes removed from onboarding + active + loading. Stale "Connect Spotify" → Apple Music.
- Loading screen now shows "Getting things ready".

## 7. Auto-advance on natural song end ✅ DONE 2026-06-08
Native MusicKit observer (`SystemMusicPlayer.queue.objectWillChange` via Combine, deduped) →
Expo `onTrackChange` event → engine updates current track. Handles natural advance AND manual
skips. (Pattern from research; needs device build to confirm.)

## Polish pass ✅ 2026-06-08
- Lock icon moved inline next to the status text (no longer floating top-right).
- Manual pace = a **scroll wheel** (120–200 spm) with key paces labeled (brisk walk / easy
  run / typical run / fast run), replacing the preset buttons + text field.
- **Queue auto-replenish:** when ≤2 songs remain, page through the catalog (native search
  `offset`) for fresh matches and append them, so the music never just ends. Deduped by id.

## Cadence guard rails ✅ 2026-06-08
Research-backed band: **FLOOR = 50, CEILING = 240 spm** (240 clears sprinting; <50 isn't
purposeful walking; both still matchable via half/double). In `_handleCadenceReading`:
- spm = 0 → ignore, keep playing (no target change, no notice).
- spm > 240 or < 50 → keep current target, set `state.notice` (amber message, e.g. "Read 250
  spm. Too fast to be real, holding 172. Recalibrate if that's off.").
- in-range → update as before, clears notice.
Constants in `src/types.ts`. JS-only (no rebuild).

## Settings screen ✅ 2026-06-08
`app/settings.tsx`, reached via a gear on the home page. iOS-grouped style.
- **Tempo matching:** toggles for Exact / Half-time / Double-time (default all on). Warning when
  ≤1 mode on ("fewer songs, may hear repeats"). Can't reach zero modes (falls back to exact).
- **Strictness:** segmented Tight (3%) / Normal (6%) / Loose (10%) → match tolerance.
- **Reset to defaults.**
- Persisted via `getMatchSettings`/`saveMatchSettings` (AsyncStorage). `MatchSettings` in types.
- Threaded: match.ts now takes `MatchOptions {multiples, tolerance}`; api.ts converts settings →
  options; engine loads settings at session start and passes them to every fetch.
- NOTE: settings load at session start, so changing them mid-session applies on the next session.

## Cadence redesign ✅ 2026-06-08 (grilled — see CONTEXT.md + docs/adr/0001)
Root cause was cumulative pedometer steps ÷ a resetting window (avg-since-start + 2000-spike
on recalibrate). Rewrote to **perceived cadence** (rolling 8s window, decays to 0 on stop) +
**managed cadence** (follows on sustained drift, tunable via Pace sensitivity setting) +
song-switching (boundary default / immediate). Pure `perceivedCadence()` unit-tested. Both
numbers shown on screen for now.

## Known bugs / next up
- **Natural song-end doesn't update the on-screen track.** We load the full queue into the
  system player so it plays through, but when a song ends *on its own* the engine's index/
  currentTrack don't advance (no native now-playing event yet). Skip/prev keep it in sync.
  Fix later with a MusicKit now-playing observer → Expo event.

## Playback model change (2026-06-07)
Switched from one-song-at-a-time to **loading the whole matched queue** into SystemMusicPlayer
(`playQueue`), with skip driven by native `skipToNext`/`skipToPrevious`. Fixes "only one song,
then repeats" and the dead skip buttons.

## Housekeeping
- Remove the temporary `[Cadence:recs]` / `[Cadence:session]` diagnostic logs now that the
  pipeline is confirmed working end to end.
