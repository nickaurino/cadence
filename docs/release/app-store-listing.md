# Cadence — App Store Listing Copy

Ready-to-paste copy for App Store Connect. Category: **Health & Fitness**.
Rules baked in: no "~10%" effort stat in metadata (kept in-app only), Apple
Music requirement disclosed, no efficacy/health claims (Health & Fitness review
lens), no em dashes. Character counts noted against Apple's field limits.

---

## App name (30 max) — ALREADY SET
`Cadence: Music at Your Pace`  (27)

## Subtitle (30 max)
`Songs that match your stride`  (28)

Alternates if you want a different angle:
- `Run and walk to the beat`  (24)
- `Music timed to your steps`  (25)

## Promotional text (170 max — editable anytime, no review)
`Cadence finds songs whose beat lands on your stride and keeps the music matched as you speed up or slow down. Pick a vibe, start moving, and let it keep your pace.`  (163)

## Keywords (100 max, comma-separated, no spaces)
`running,walking,tempo,bpm,music,runner,jogging,treadmill,workout,pace,steps,beat,fitness,playlist`  (97)

Notes: "cadence" is omitted on purpose — Apple already indexes your app name,
so repeating it wastes characters. Brand terms (e.g. "apple music") are left out
to avoid trademark-keyword rejections.

## Description (4000 max) — conversational prose, no caps headers or bullets

```
Cadence plays music that matches how you move.

Start a session and Cadence reads your steps, then pulls songs from Apple Music whose tempo lands on your stride. Speed up and the music speeds up with you. Slow down and it eases back. The beat stays with your feet, so you can stop thinking about the playlist and just go.

There's nothing to set up. Pick a vibe, start moving, and the matching happens on its own. When you'd rather take the wheel, set a pace by hand for the treadmill, lock a tempo to hold it steady, or recalibrate any time the match drifts.

Playback uses your Apple Music subscription. You can still see your cadence without one, but matched songs play through Apple Music.

Cadence runs entirely on your phone. It reads your steps to find the right music and does nothing else with them. No account, no analytics, no tracking, and nothing leaves your device.

Lace up and let the music keep your pace.
```

---

## App Review notes (the field that prevents a first-try rejection)

```
No account or login is required.

Playback requires an active Apple Music subscription. Pace detection works without one, and the app offers a "continue without" path during setup.

IMPORTANT FOR REVIEW: Music matching is driven by physical movement (step rate from Core Motion). On a stationary review device, no steps are detected, so no songs will queue automatically. To test playback without walking:
  1. Start a session (choose any vibe).
  2. On the session screen, tap "Set pace".
  3. Dial any pace (for example 150) and confirm.
Cadence will then match and play songs at that tempo with no movement required.

The motion permission prompt appears the first time a session starts. Apple Music authorization is requested during onboarding.
```

---

## Other App Store Connect fields

- **Support URL**: `https://github.com/nickaurino/cadence` (or your portfolio URL)
- **Marketing URL** (optional): portfolio project page, if you have one
- **Copyright**: `2026 Nicholas Aurino`
- **Privacy Policy URL**: `https://github.com/nickaurino/cadence/blob/main/PRIVACY.md`
- **Age rating**: answer every questionnaire item "None" → rated 4+
- **Price**: Free, all territories

---

## Screenshot shot list (capture from the TestFlight build or a fresh sim build)

Required: 6.9" (iPhone 16 Pro Max class). 6.5" optional if you reuse the 6.9".
Capture 3 to 5; Apple shows the first 3 most prominently, so order matters.

1. **Active session, in the pocket** — ring glowing gold, hero cadence number,
   a matched track on the card. THE money shot; make it first.
2. **Home** — the glowing Start ring and the new icon's mark. Clean brand moment.
3. **Vibe select** — shows the "pick a sound" choice, low-friction setup.
4. **Track card + progress bar** — close on the matched song with its BPM.
5. **End summary** — the avg-cadence ring, a satisfying finish.

Tip: the cadence smoothing makes the number sit still, so the active-session
shot will look calm and intentional rather than mid-twitch.
