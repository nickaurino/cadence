# Cadence — App Store Readiness Plan

Path from "works on Nick's phone" to "live on the App Store", in order. Built
from the June 2026 security/compliance audit (all in-repo blockers are already
fixed and committed). Check items off as they complete.

The shape: **Phase 1-2 once → Phase 3-4 loop a few TestFlight rounds → Phase
5-6 once → submit.**

---

## Phase 0 — Already done (in-repo, committed)

- [x] `ITSAppUsesNonExemptEncryption: false` (skips the export-compliance
      question on every upload; HTTPS-only = exempt, no French declaration needed)
- [x] Unused `NSHealthShareUsageDescription` removed (metadata-mismatch
      rejection trigger; app uses CMPedometer, not HealthKit)
- [x] Icon + splash wired into `app.json` (store build would have shipped
      icon-less); buildNumber added
- [x] Usage descriptions sharpened (motion: "never tracks your location")
- [x] Dead Spotify client ID deleted from `.env`
- [x] `analyzeTrack` requires https URLs (JS-exposed native input hardened)
- [x] Privacy manifest (`PrivacyInfo.xcprivacy`): UserDefaults/FileTimestamp/
      SystemBootTime declared, no tracking, no collected data — matches the
      actual API surface
- [x] Full code review of every line (engine races, native module, UI) — see
      git log mid-June 2026

## Phase 1 — Accounts & portal (one-time, ~1 day incl. processing)

1. [ ] **Apple Developer Program** membership active ($99/yr) on the account
       that owns `com.nickaurino.cadence`.
2. [ ] **Enable the MusicKit App Service** on the App ID: developer.apple.com →
       Certificates, Identifiers & Profiles → Identifiers →
       `com.nickaurino.cadence` → **App Services** tab → check MusicKit.
       ⚠️ This is the audit's #1 blocker: catalog search/playback relies on
       automatic developer-token generation, which silently 401s in
       release-signed builds if this box isn't checked. Dev builds can mask it.
3. [ ] **Create the app record** in App Store Connect (My Apps → "+"):
       name "Cadence" (have a backup name in case it's taken — e.g.
       "Cadence — Music at Your Pace"), primary language, bundle ID, SKU.
4. [ ] **Privacy policy page** — required for the listing AND external
       TestFlight even with zero data collection. One page on the portfolio
       site: what the app accesses (motion, Apple Music), that everything stays
       on-device, no analytics/ads/accounts, contact email. Note the URL.

## Phase 2 — Release build config (half a day)

1. [ ] `npx expo prebuild -p ios --clean` — regenerates `ios/` from `app.json`
       so the new infoPlist keys, icon, and splash actually land (`ios/` is
       gitignored; the committed config is the source of truth).
2. [ ] Re-run the device build once after prebuild
       (`LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios -d <UDID>
       --configuration Release`) and smoke-test: onboarding → tour → real
       session with music. Release config catches things Debug hides.
3. [ ] Decide build pipeline: **EAS Build** (`eas build -p ios --profile
       production` — easiest, cloud-signed) or local Xcode archive. EAS
       recommended; `eas.json` already exists.
4. [ ] First archive → Xcode Organizer (or EAS artifacts) → **Generate Privacy
       Report** → confirm no undeclared required-reason categories (the one
       occasionally flagged in the RN ecosystem is disk-space access; add
       `E174.1`/`85F4.1` to `PrivacyInfo.xcprivacy` only if named).

## Phase 3 — TestFlight, internal (the "test a couple times" loop)

Internal testers (your own App Store Connect users, up to 100 devices) need
**no review at all** — builds are testable minutes after upload.

1. [ ] Upload build 1 (`eas submit -p ios` or Xcode Organizer → Distribute).
2. [ ] App Store Connect → TestFlight → add yourself (+ Zernell if he has an
       invite-able Apple ID) as internal testers.
3. [ ] **Test pass per build** (the real-world checklist):
       - [ ] Fresh install: onboarding (both permission prompts fire), guided
             tour end-to-end, Skip tour
       - [ ] Real outdoor/treadmill session: calibration → music matches pace →
             pace change re-matches → "On the beat" behavior
       - [ ] Manual pace / pace lock; recalibrate; song skip; play/pause;
             progress bar
       - [ ] Background + kill mid-session → reopen → resume works, steps
             survive, music state honest
       - [ ] Deny motion → no-motion screen paths; deny Apple Music →
             "continue without"
       - [ ] No Apple Music subscription account (or expired): degraded path
             doesn't dead-end
       - [ ] Settings: every toggle, Replay tour, Reset app, Credits
       - [ ] Audio interruptions: phone call mid-session, AirPods connect/
             disconnect, CarPlay if available
       - [ ] Older/smaller device if available (SE-class screen: layout, Skip
             button placement)
4. [ ] Fix → bump `buildNumber` in `app.json` → prebuild → upload again.
       Repeat until a build survives a full week of real runs with nothing new.
       **Expect 2-3 rounds; that's the plan, not a failure.**

## Phase 4 — TestFlight, external (optional but recommended, ~1-2 days)

External testers (friends via email/public link, up to 10,000) require **Beta
App Review** — a lighter version of real review, and a good dress rehearsal.

1. [ ] Create an external group, add 3-5 friends with iPhones + Apple Music.
2. [ ] Provide beta description + feedback email; export compliance is already
       auto-answered by the plist key.
3. [ ] Submit the build for Beta App Review (usually <24h).
4. [ ] In the invite, tell testers: needs an Apple Music subscription for
       playback; works degraded without. Ask them to run the Phase 3 checklist
       highlights and use TestFlight's built-in screenshot feedback.

## Phase 5 — App Store listing (can prep in parallel, ~1 day)

1. [ ] **Screenshots** — required sizes: 6.9" (Pro Max) and 6.5" (or use the
       6.9" for all). Capture: home, active session in the pocket (ring gold),
       track card + progress bar, vibe select, end summary. The simulator's
       `Cmd+S` or device screenshots both work.
2. [ ] **Description** — rules from the audit:
       - State the Apple Music requirement up front, gently (reuse the
         onboarding line: "Playback needs an Apple Music subscription. Pace
         detection works without one.")
       - **Do NOT use the "~10% less perceived effort" stat in the description
         or screenshots** — fine in-app (hedged, in context), but in metadata
         it's an unverifiable product claim (Guideline 2.3.1). Sell the
         experience: "music that lands on your stride."
3. [ ] Keywords, subtitle, support URL (portfolio), marketing URL (optional),
       category (Health & Fitness or Music — Music avoids the health-claims
       lens; decide once).
4. [ ] **Privacy label**: "Data Not Collected" (accurate: nothing leaves the
       device). Privacy policy URL from Phase 1.
5. [ ] Age rating questionnaire (4+), price (free), availability.

## Phase 6 — Submission

1. [ ] Pick the final TestFlight-proven build; attach to the version.
2. [ ] **App Review notes** (this is what prevents the dumb rejection):
       - "Playback requires an active Apple Music subscription. Pace detection
         works without one — the app shows a 'continue without' path."
       - "Music matching needs physical movement (steps). On a stationary
         review device: tap 'Set pace' on the session screen to dial a manual
         pace; music will play matched to it without walking."
       - Optionally a 30s screen-recording link showing the core loop.
3. [ ] Submit. First-app reviews typically take 1-3 days. If rejected: read the
       exact guideline cited, fix only that, respond in the Resolution Center —
       don't argue, don't bundle unrelated changes.
4. [ ] Release option: manual release after approval (recommended for v1, so
       launch happens on your schedule).

## Known rejection-risk cheat sheet (from the audit)

| Risk | Status |
|---|---|
| MusicKit service not enabled → 401s in review | Phase 1.2 — DO THIS FIRST |
| Default/missing icon (2.1) | fixed in repo; verify after prebuild |
| Health purpose string w/o HealthKit (2.1/5.1.1) | fixed in repo |
| "10%" stat in metadata (2.3.1) | keep it in-app only |
| Subscription requirement hidden (2.3.10) | disclosed in-app + description + review notes |
| Background audio mode declared unnecessarily (2.5.4) | correctly NOT declared (system player plays, not us) |
| Privacy label vs. manifest mismatch | both say "no collection" — consistent |
| Reviewer can't trigger music (stationary desk) | review notes: manual pace path |

## After approval

- Swap TestFlight links for the App Store link on the portfolio site (it lists
  Cadence) and the GitHub profile README.
- Tag the release in git (`v1.0.0`) and finally push `main` to GitHub — the
  repo is months ahead of `origin`.
