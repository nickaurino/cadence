# 01 — Screen Taxonomy & UX

*Cadence app revamp — design research deliverable*

Cadence is a running/walking app that matches Apple Music songs to your step cadence. This document synthesizes industry research on mobile screen architecture, CTA psychology, visual restraint, and micro-animation into **concrete, build-ready decisions** for Cadence's three load-bearing screens: **Home/Start**, **Selector (vibe + pace)**, and **Active/Now-Playing**.

The governing constraint for every decision below: the runner is **moving, sweating, glancing for under one second, in sunlight, with one thumb.** Glanceability and restraint are not aesthetic preferences here — they are the product.

---

## Part A — Industry Screen Taxonomy: names + what makes each good

### A.1 The First Screen — three different things, don't conflate them

| Term | What it is | Apple's rule |
|---|---|---|
| **Launch screen** | Near-instant placeholder shown while the app boots | *"A launch screen is not an onboarding experience or a splash screen; its sole function is to enhance the perception of your experience as quick to launch."* Design it nearly identical to the first real screen; avoid text (can't be localized); no logo moment. ([Apple HIG — Launching](https://developer.apple.com/design/human-interface-guidelines/launching)) |
| **Onboarding** | Brief first-run flow | *"Keep onboarding brief — three screens max, and let users skip."* Ask for setup info only when necessary. ([Apple HIG — Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)) |
| **Home / hero screen** | Recurring landing screen with the primary CTA | One dominant CTA, above the fold, in the thumb zone |

**What makes it good:**
- **Skip onboarding when possible.** Feature carousels at first launch get skipped — *"users rarely download an app for no reason."* Reserve in-app onboarding for genuine setup needs or genuinely unfamiliar UI. ([NN/g — Mobile-App Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/), [NN/g — Skip it When Possible](https://www.nngroup.com/videos/onboarding-skip-it-when-possible/))
- **Avoid the generic "Get Started" button.** A prominent ambiguous CTA attracts clicks but misleads — users expecting to *do the thing* get dumped into a flow and lose trust. Name the actual action. ([NN/g — Get Started Stops Users](https://www.nngroup.com/articles/get-started/))
- **One primary action, above the fold.** Multiple competing CTAs reduce action rates. ([NN/g — Mobile Navigation Patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/))

**Pitfalls:** splash masquerading as launch screen; forced unskippable onboarding (*"forced onboarding increases drop-off"*); cold permission walls (HealthKit / Apple Music auth before the user sees value).

### A.2 The Selector — a fast 2-axis picker, not a settings form

This is a **selection/configuration screen** built from **selection controls**. Material 3's cardinal rule: *"Selected items should be more visually prominent than unselected items; it should be visible at a glance whether a control is selected,"* and for single-choice patterns *"only one item selected at a time."* ([Material 3 — Selection](https://m3.material.io/foundations/interaction/selection))

**Choosing the right control (the load-bearing decision):**

| Control | Best for | Cadence fit |
|---|---|---|
| **Segmented control** | 2–5 mutually exclusive options, short labels, all visible | **Vibe axis** (Chill · Steady · Push) |
| **Radio buttons** | >5 options or options needing descriptions | Not needed |
| **Chips** | Scannable set of content-like tags | Alt for vibe if 4–5 |
| **Slider** | A *continuous* value (pace / cadence BPM·SPM) with live readout | **Pace axis** |

Apple's own Intervals and WorkoutDoors expose pace/cadence as **ranges**, not single values. ([Apple Intervals](https://wrinkledrunner.com/apple-intervals-app-for-runwalk-or-long-run-fueling-prompt/), [WorkoutDoors](http://www.workoutdoors.net/Intervals.html))

**What makes it good:** all options visible, single selection obvious, instant feedback, **sensible defaults pre-selected** (selector is optional refinement, not a gate), and a **live preview of consequence** (show BPM as pace changes).

**Pitfalls:** dropdown/picker-wheel for 3–4 options; >5 segments in a segmented control; multi-step wizard for two settings (onboarding creep); ambiguous selected state (Material's #1 warning).

### A.3 The Active / Now-Playing screen — glanceability is the entire job

The in-app full screen is the **Now-Playing / active-session screen**. Its system-surface cousins (lock screen, Dynamic Island, Watch) are **Live Activities**, and their design rules transfer directly because the runner glances rather than reads. ([Apple — Design dynamic Live Activities, WWDC23](https://developer.apple.com/videos/play/wwdc2023/10194/))

Live Activity guidance that applies cleanly:
- *"Prioritize glanceable content over detailed data. Avoid overcrowding."*
- *"Prioritize passive awareness, not interaction. Display essential, time-sensitive information."*
- *"Avoid low-contrast elements; avoid lengthy animations and frequent, distracting updates."*
([Secture/Wikiloc case study](https://secture.com/en/guide-and-best-practices-of-live-activities-design-for-iphone-case-study-with-wikiloc/), [Create with Swift](https://www.createwithswift.com/understanding-live-activities-visual-micro-storytelling/))

For Now-Playing specifically: large album art, clear track/artist, dominant transport controls, minimal chrome. ([Revamping the Now Playing Screen UI](https://medium.com/design-bootcamp/revamping-the-now-playing-screen-ui-improve-your-music-streaming-experience-12169e97474b))

**Pitfalls:** dashboard overload (a wall of equal-weight metrics); tiny targets / low contrast; flashy re-renders; buried Stop/Pause; ambiguous skip.

---

## Part B — CTA Psychology & Visual Restraint

### B.1 What actually makes a thumb move toward a button

- **Affordance: it must look pressable before it looks pretty.** A filled background is the strongest affordance signal. Apple HIG: *"Use a filled button for the most likely action in a view. The filled style is the most visually prominent, so it helps people quickly identify the action they're most likely to want."* Affordance is a *budget* — reserve underlines for links so the underline stays a reliable click signal. ([Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Rauno Freiberg — Interface Guidelines](https://github.com/raunofreiberg/interfaces))
- **Contrast is the single biggest lever, and it's relative.** A CTA pops because it is the highest-contrast element *against its neighbors* — not because the color is loud. WCAG floors are **3:1** for button shape vs. background and **4.5:1** for label text: non-negotiable minimums. The premium move is to keep the whole screen low-contrast and let exactly one element spike.
- **Size and hit target are two different numbers.** Visual size signals importance; hit target is separate — Apple mandates a **minimum 44×44pt** tap target (sub-44pt pushes tap-error rates above 25%). Rauno: *"Interactive elements in a vertical or horizontal list should have no dead areas between each element, instead, increase their padding."*
- **Copy: verb-first, first-person, specific.** "Start Run" beats "Start"; "Match My Cadence" beats "Continue." Never stack two filled buttons with competing verbs — the #1 hierarchy failure.
- **Placement: bottom-anchored, in the thumb arc, with air around it.** Apple HIG: *"include enough space around a button so that people can visually distinguish it from surrounding components and content."* Whitespace is the contrast mechanism, not decoration.
- **Anticipation / feedback — where premium is won or lost** ([Rauno](https://github.com/raunofreiberg/interfaces), [Emil Kowalski](https://emilkowal.ski/ui/train-your-judgement)):
  - Press scale is subtle and proportional: *"Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."*
  - Speed: *"Animation duration should not be more than 200ms for interactions to feel immediate."*
  - *"Actions that are frequent and low in novelty should avoid extraneous animations."* A daily "Start Run" should feel crisp and quiet, not bouncy.
  - Disable the system gray tap-highlight; replace with an intentional press state (SwiftUI custom `ButtonStyle` with scale + opacity). *"Hover states should not be visible on touch press."*
  - **Disable the button after submission** to prevent double-fires — once Start is tapped and GPS/audio spins up, it enters a loading state immediately.

### B.2 Looking expensive and calm, not noisy

The throughline across Refactoring UI, Apple HIG, and Rauno: **expensive design is mostly subtraction.**

- **One clear action per screen.** A layout should contain a single high-emphasis (filled) button; everything else steps down — secondary = outlined/ghost, tertiary = text/overflow. If two things look equally important, the user has to *think*, and thinking reads as cheap. ([Refactoring UI hierarchy](https://jacobshannon.com/blog/books/refactoring-ui/hierarchy-is-everything/), [Carbon — Button usage](https://carbondesignsystem.com/components/button/usage/))
- **De-emphasize, don't add.** When something feels unimportant, the cheap instinct is to make the important thing louder; the expensive instinct is to make everything else quieter.
- **Restraint in motion = perceived quality.** One well-tuned 180ms press beats five flashy transitions. ([Emil — Train Your Judgement](https://emilkowal.ski/ui/train-your-judgement))
- **Typography does quiet heavy lifting.** Never use weights below 400; medium headings at 500–600; use **`tabular-nums`** for anything that updates live — critical for Cadence so live SPM, pace, distance, and time don't jitter as digits change.

---

## Part C — Micro-Animation Guidance (per screen)

### C.0 The four rules that govern everything

1. **`ease-out` (decelerate) is the default** for anything entering or moving on-screen — it accelerates at the start, giving a feeling of responsiveness. ([Emil — 7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips))
2. **Keep it short and precise.** Apple: *"Prefer quick, precise animations."* Material baseline: transitions ~300ms, entering ~225ms, exiting ~195ms, full-screen up to ~375ms, and *"transitions that exceed 400ms may feel too slow."* ([Material — Duration & Easing](https://m1.material.io/motion/duration-easing.html), [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion))
3. **Animate only `transform` and `opacity`** — everything else triggers layout/paint and drops frames. *"If our animations won't run at 60 frames per second, everything else becomes useless."* ([Emil — Great Animations](https://emilkowal.ski/ui/great-animations))
4. **Don't animate frequent, repeated interactions.** Apple: *"avoid adding motion to interactions that occur frequently."* This is the single most-violated rule and the easiest way to make an app feel cheap — decisive for the always-on Active screen.

Plus: motion should be **interruptible** (tap Start then immediately Stop must not wait) and **spring-driven / natural**. SwiftUI is spring-by-default since iOS 17: `.smooth`, `.snappy`, `.bouncy`. ([Nil Coalescing](https://nilcoalescing.com/blog/AnimationTimingInSwiftUI/))

**Performance reality:** a run can be 45+ minutes with the screen on, GPS streaming, audio playing, HealthKit polling. Frame budget is **16.67ms**. Anything ticking every frame (a pulsing ring) must be a single composited transform/opacity layer, never a re-layout — and profiled with the screen on for 30+ minutes, since drops compound as the device warms.

### C.1 Start screen — low-frequency, can afford personality

- **Entrance:** stagger hero elements in with decelerate easing, ~225ms each, ~40–60ms apart. Order: title → cadence target → Start button last, so the eye lands where the thumb goes. Translate + fade only.
- **Start press (the money interaction):** scale to **0.96–0.97** with a `.snappy` spring, paired with a single `UIImpactFeedbackGenerator(.medium)`.
- **Origin-aware transition out:** when Start launches the Active screen, scale/expand **from the button's position**, not screen center — this makes the transition feel caused-by-the-tap. ([Emil — 7 Tips](https://emilkowal.ski/ui/7-practical-animation-tips))

### C.2 Selector screen — lists and sheets, get out of the way

- **Sheet present (playlist source):** rise with iOS decelerate easing, **~400ms** (Material's 400ms ceiling as guardrail). **Dismiss faster** (~195–225ms, accelerate). Make it **interruptible and gesture-driven** — follows the finger, flick-dismissible, springs back if released 30% down.
- **List rows:** a subtle stagger on *first* mount only (~30ms apart, first 6–8 rows); re-scrolls and re-renders are instant. Staggered rows on every appearance are the #1 overused effect.
- **Selection state:** `.snappy` spring on the checkmark/ring with an **origin-aware scale from the tap point** + a light selection haptic.

### C.3 Active-run screen — the discipline screen

- **Cadence ring / SPM indicator:** a slow continuous **breathing pulse** synced to *target* cadence — the one place a running app earns living motion (it's a metronome you feel). `transform: scale` only (e.g. 1.0↔1.03), composited.
- **Cadence lock:** fire the **one** celebratory beat — a `.bouncy` pop + single success haptic + accent color easing in. Spend the bounce budget here and nowhere else.
- **Live numbers:** animate transitions *between values* (odometer roll / crossfade, ~150–200ms ease-out) only when the value changes — **never animate the once-per-second clock** (rolling it would be nauseating over 40 minutes). Use tabular figures.
- **Controls:** scale 0.96 + `.snappy` + medium haptic.
- **Song re-match:** origin-aware horizontal slide + artwork crossfade, ~225ms — present but quiet (it happens many times per run).
- **Reduced Motion (mandatory):** Apple HIG: *"Make motion optional… minimize or eliminate animations."* For a running app this is a **vestibular safety** issue — bouncing/parallax while the user is physically moving can trigger nausea. Swap movement for opacity; hold the cadence ring steady rather than pulse.

---

## Part D — Concrete Cadence Applications

This is the build spec. Every recommendation names the exact behavior and a note on its slight animation.

### D.0 Palette evolution (context for all states below)

App #3 must read as a sibling of apps #1–2, not a clone, and must **kill the Spotify-green `#1DB954`** — it fights the warm walnut palette, reads as a borrowed brand, and is a high-chroma large fill (inherently noisy).

| Token | Value | Role |
|---|---|---|
| Undercoat | `#1a0f08` | Deepest background |
| Coat / surface | `#2e1a0e` | Cards, sheets, chips |
| Border / grain | `#4a2e18` | Hairlines, outlined buttons |
| Muted | `#8a7060` | Inactive / secondary / tertiary text |
| Accent (Bed Medium) | `#c8b89a` | Live/active values, secondary metrics |
| Accent dim | `#3d2a1a` | Progress-bar tracks, pressed/disabled fill |
| Text | `#e8ddd0` | Single most-important live value, in-zone state |
| **New energized warm** | burnt amber `~#E08A3C` family | **Reserved for exactly one thing per screen:** the primary CTA fill and the live cadence-match / in-sync indicator |

The new amber must only appear **at full saturation in motion** — the cadence-lock glow, the active ring, the live-pace highlight — so the accent *literally means "you're in sync."* Validate its contrast against `#1a0f08` for the big SPM numerals (≥3:1 shape / 4.5:1 text) before committing.

### D.1 Home / Start screen

- **Single "Start Run" hero** (filled amber, dark walnut `#1a0f08` label for max legibility) in the **thumb zone** over a warm dark field. ≥44pt height, generous padding.
- If a previous session exists, **"Resume — Sunset · 7:00 pace"** as the *one* secondary action (outlined, `border #4a2e18`).
- **Defer Apple Music + Motion/Fitness permission prompts until the user taps Start** — contextual, not a cold wall.
- **No onboarding carousel.** If cadence-matching needs explaining, do it as a one-line caption under the button, not a 4-screen tour.
- **Animation:** staggered entrance (225ms, ease-out, ~50ms apart, Start last); press scale 0.96 + `.snappy` + medium haptic; origin-aware expand into the Active screen from the button's position. After tap, Start immediately becomes a disabled/loading state filled with `accentDim #3d2a1a` so it visibly recedes.

### D.2 Selector (vibe + pace)

- **Vibe = a 3–5 option segmented control or chip row** (e.g. **Chill · Steady · Push**), single-select, with the active segment in amber — unmistakably highlighted.
- **Pace = a slider with a live SPM readout** that *also shows the matched BPM*, so the runner connects "faster pace → higher-tempo songs."
- **Pre-select the last-used combo.** Sticky **Start** at the bottom (thumb zone). One screen, **no Next buttons.**
- **Hide behind "Advanced":** genre exclusions, explicit filter, playlist source. Don't crowd the two primary axes.
- **Animation:** active-segment selection = `.snappy` spring, origin-aware from tap point, light haptic; live SPM/BPM readout uses a ~150ms odometer roll/crossfade on change (tabular figures, no bounce on increment). Advanced sheet presents at ~400ms ease-out, dismisses faster, fully interruptible/gesture-driven.

### D.3 Active screen — which numbers to show vs. demote

The leaders prove that **fewer is better.** Nike Run Club leads with distance · pace · time; Strava's redesigned Record shows only **2–3 metrics** (and swaps elevation for pace contextually) and has *resisted years of customization requests* — they treat the constraint as a feature. Apple caps custom workout views at **5 metrics**. ([Nike — NRC features](https://www.nike.com/help/a/nrc-run-features), [Strava — redesigned Record](https://press.strava.com/articles/strava-launches-redesigned-record-experience), [Apple — workout views](https://support.apple.com/guide/watch/workout-views-and-running-metrics-apd1f24d4d35/watchos)) Cognitive-load research backs this: a dashboard of 23 metrics had users *"playing Where's Waldo with their own data"* until it was collapsed to **three primary metrics**. ([NN/g — Cognitive Load](https://www.nngroup.com/articles/minimize-cognitive-load/), [LogRocket — Cognitive Overload](https://blog.logrocket.com/ux-design/cognitive-overload/))

| Tier | What | Treatment |
|---|---|---|
| **Hero (one number)** | **Current cadence (SPM)** — Cadence's whole reason to exist and what NRC/Strava/Apple do *not* foreground; it's the differentiator and the live proof the match is working | Largest element, 64–80pt, `text #e8ddd0`, with a small live trend caret ▲/▼ vs. target |
| **Secondary trio** | **time · distance · pace** (NRC's proven set) | Row beneath hero, ~28–32pt, `accent #c8b89a` |
| **Demoted / tucked** | calories, BPM/heart rate, total step count, full song metadata | Swipe-to-second-page or `muted #8a7060` at the very bottom |

**Do not build user-customizable metric slots for v1.** Strava has 20k+ upvotes asking and still ships an opinionated fixed layout. A curated layout is faster, more beautiful, and avoids the "everyone configures a cluttered mess" failure mode.

A small **status pill** shows the active vibe + pace ("Push · 165 SPM") so the runner knows what's playing without re-entering the Selector. Mirror this exact hierarchy (SPM + track) into a **Live Activity / Dynamic Island** — table stakes for a running+music app.

- **Animation:** the cadence ring breathes (scale 1.0↔1.03, synced to target); the hero SPM uses a ~150–200ms odometer roll only when it changes; the clock and counting metrics update instantly (never animated). Reduced Motion holds the ring steady and swaps slides for fades.

### D.4 Progress bars / rings — match the UI to the session type

Apple's rings are a closed-loop radial indicator: fraction of goal = fraction filled, designed to read at a glance. **The catch: rings need a goal.** A free "just go for a run" session has no natural 0→100%. ([Apple HIG — Activity Rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings))

| Session type | Progress UI |
|---|---|
| **Goal-based** (target distance/time, guided playlist) | A **single radial ring wrapping the hero SPM number** — the ring *is* the cadence dial and the progress meter at once. Track `accentDim #3d2a1a`, fill `accent #c8b89a` |
| **Cadence-lock (always-on)** | A **thin arc / tick gauge** behind the hero showing the **target cadence band** (e.g. 160–170 SPM) with a moving live-SPM indicator — borrows Peloton's target-range model; answers "am I in the zone the music is set to?" ([PeloBuddy — target metrics](https://www.pelobuddy.com/app-target-metrics/)) |
| **Open free run (no goal)** | Skip the ring; use a **slim linear song-progress bar** at the bottom tied to the now-playing track |

When live SPM enters the target band, the in-zone state **brightens toward `text #e8ddd0`** and the amber match-indicator eases in.

- **Animation:** ring fill animates with `.smooth` (ambient, transform/opacity only); the in-zone transition is a spring-driven color ease (note: on a non-native path, color cannot use the legacy native driver — run it through SwiftUI springs / Reanimated worklets). The cadence-lock moment is the single `.bouncy` celebration in the whole app.

### D.5 The pace lock (and the manual-pace side affordance)

Accidental pause/stop is the **#1 reported active-screen failure** — NRC ships an explicit screen lock specifically to *"stop you accidentally hitting pause or other buttons."* ([Nike — NRC features](https://www.nike.com/help/a/nrc-run-features), [Apple Discussions](https://discussions.apple.com/thread/250902581))

- **Lock toggle (padlock glyph):** disables all touch targets except a deliberate unlock. **Locking hides *controls*, never *data*** — the hero SPM and secondary trio stay fully live and visible.
- **Unlock = press-and-hold or slide**, never a tap. Show a subtle "hold to unlock" hint.
- **Pause:** a single clearly-tappable control, *not* edge-adjacent to where a thumb rests. When paused, the **whole screen changes state** (dim the hero, show a "PAUSED" band in accent) — uncertainty about whether it actually paused is a top NRC complaint.

**Manual-pace as an expandable side affordance.** Cadence's magic is "music follows my feet"; manual is the escape hatch, not the default. Keep the active screen minimal and push deep controls behind one affordance (Apple Music/Spotify keep Now-Playing to art + transport and tuck the rest away).

- **Resting state — a "tempo chip":** a small pill anchored to the **lower-right edge** showing current target SPM + a tiny metronome glyph. `surface #2e1a0e` fill, `border #4a2e18` hairline. Reads as "tap to adjust tempo," stays clear of the hero number, never competes for the glance.
- **Expanded state (bottom sheet, not a nav push — never lose sight that a session is live):**
  - a horizontal **tempo slider/stepper** to nudge target SPM ±, with the queue re-matching live;
  - a first-class **auto / manual toggle** — default **auto** ("match my current pace" sets tempo from actual steps), manual one tap away;
  - the now-playing card (art in `surface`, title in `text`, artist in `muted`) with prev / play-pause / next.
- **Dismiss:** tap-away or drag-down collapses back to the chip.

This keeps the main screen at essentially **two interactive elements** — the tempo chip + the lock/end control — the right restraint for a moving user.

- **Animation:** chip → sheet expands origin-aware from the chip's lower-right position (~400ms ease-out), fully interruptible/gesture-driven, dismisses faster (~200ms); the auto/manual toggle takes effect immediately with a light haptic; tempo changes roll the SPM readout (~150ms, tabular). Lock engaging/disengaging is a quiet crossfade of the control layer (data layer untouched). Pause dims the hero with a `.smooth` spring and gently dims (does not abruptly stop) the ring pulse; resume springs it back.

### D.6 End-session UX

The destructive-action literature is consistent: for high-risk actions add **intentional friction** via a swipe/hold gesture, and warn with color. Swipe-to-confirm (Uber/Amazon-style) is the cited pattern for critical actions. ([UX Movement — destructive actions](https://uxmovement.com/buttons/how-to-design-destructive-actions-that-prevent-data-loss/), [GitLab Pajamas](https://design.gitlab.com/patterns/destructive-actions/))

- **Stop = slide-to-end, not a tap.** A "▸ slide to finish" track at the bottom of the (unlocked) screen. The gesture **is** the confirmation — it kills the accidental-end problem and removes the need for a separate "are you sure?" modal. Stay on-brand instead of literal red: track `accentDim #3d2a1a`, thumb `accent #c8b89a`, label `text #e8ddd0`. Keep **End** quiet/tertiary so it never competes with the live-run UI.
- **Hold-to-pause vs. slide-to-end** are made physically distinct so neither triggers the other by accident.

**Summary screen — make it music-native (no competitor does this).** Strava and NRC converge on: route map + distance/time/pace/calories + per-mile splits with pace charted. ([Strava — Run Activity Pages](https://support.strava.com/hc/en-us/articles/216919567-Run-Activity-Pages)) Cadence's differentiated version:

- **Top hero:** average cadence (SPM) alongside distance · time · pace (the expected four).
- **Cadence-over-time chart** — Cadence's version of Strava's pace-over-splits graph — **overlaid with the songs that played in each segment** ("you ran your fastest split to [Song]"). This is the shareable, differentiated moment.
- **Per-mile splits list** with each split's dominant SPM and track.
- **Route map** below (table-stakes, not the hero).
- **A single Save / Share action, auto-saved by default** so a missed tap never loses a run.

- **Animation:** the slide-to-end thumb tracks the finger 1:1 with escalating haptics as it nears completion (the one place a deliberate, longer gesture *is* the UX); on completion the screen transitions to the summary with a calm ease-out. The summary's hero stats and cadence chart stagger in once (~225ms, ~50ms apart, ease-out) — a single quiet entrance, never re-animated.

---

## Net active-screen blueprint for Cadence

1. **Hero:** live cadence SPM (largest element) with in-zone trend caret, wrapped by a radial ring when there's a goal or a target-band gauge otherwise.
2. **Secondary row:** time · distance · pace (NRC's proven trio), visually quieter in `accent`.
3. **Tempo chip** lower-right: collapsed pill → expands to manual-pace slider + auto-match toggle + now-playing transport.
4. **Lock toggle:** hides controls, keeps data live; press-and-hold to unlock.
5. **Pause** (dramatic state change) + **slide-to-end** as physically distinct, accident-proof controls.
6. **Summary:** avg cadence + distance/time/pace hero, cadence-over-time chart annotated with songs, splits list, map — auto-saved.

**Three things to get right, in priority order:** (1) ease-out + transform/opacity only, profiled at 60fps over a full run; (2) one excellent origin-aware, haptic-paired Start→Active transition and one cadence-lock celebration — spend the taste budget there; (3) Reduce Motion fully wired, because this app is used by people in physical motion.

---

## Source list

- [Apple HIG — Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- [Apple HIG — Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Apple HIG — Activity Rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings)
- [Apple — Design dynamic Live Activities (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10194/)
- [Apple Support — Workout views and running metrics](https://support.apple.com/guide/watch/workout-views-and-running-metrics-apd1f24d4d35/watchos)
- [NN/g — Mobile-App Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/)
- [NN/g — Onboarding: Skip it When Possible](https://www.nngroup.com/videos/onboarding-skip-it-when-possible/)
- [NN/g — Get Started Stops Users](https://www.nngroup.com/articles/get-started/)
- [NN/g — Basic Patterns for Mobile Navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/)
- [NN/g — Checkboxes vs. Radio Buttons](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)
- [NN/g — Minimize Cognitive Load](https://www.nngroup.com/articles/minimize-cognitive-load/)
- [Material 3 — Selection foundations](https://m3.material.io/foundations/interaction/selection)
- [Material — Duration & Easing](https://m1.material.io/motion/duration-easing.html)
- [Selection Control Cheat Sheet (Design Group Italia)](https://medium.com/design-group-italia/the-ultimate-selection-control-cheat-sheet-dde495365d55)
- [Live Activities best practices — Secture/Wikiloc](https://secture.com/en/guide-and-best-practices-of-live-activities-design-for-iphone-case-study-with-wikiloc/)
- [Understanding Live Activities — Create with Swift](https://www.createwithswift.com/understanding-live-activities-visual-micro-storytelling/)
- [Revamping the Now Playing Screen UI](https://medium.com/design-bootcamp/revamping-the-now-playing-screen-ui-improve-your-music-streaming-experience-12169e97474b)
- [Apple Intervals app (pace/cadence ranges)](https://wrinkledrunner.com/apple-intervals-app-for-runwalk-or-long-run-fueling-prompt/)
- [WorkoutDoors interval targets](http://www.workoutdoors.net/Intervals.html)
- [Rauno Freiberg — Web Interface Guidelines](https://github.com/raunofreiberg/interfaces)
- [Emil Kowalski — Train Your Judgement](https://emilkowal.ski/ui/train-your-judgement)
- [Emil Kowalski — Great Animations](https://emilkowal.ski/ui/great-animations)
- [Emil Kowalski — 7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips)
- [Refactoring UI — Hierarchy is Everything](https://jacobshannon.com/blog/books/refactoring-ui/hierarchy-is-everything/)
- [Carbon Design System — Button usage](https://carbondesignsystem.com/components/button/usage/)
- [Nil Coalescing — Animation Timing in SwiftUI](https://nilcoalescing.com/blog/AnimationTimingInSwiftUI/)
- [Callstack — 60FPS Animations in React Native](https://www.callstack.com/blog/60fps-animations-in-react-native)
- [Nike Help — NRC run features](https://www.nike.com/help/a/nrc-run-features)
- [Strava — Redesigned Record experience](https://press.strava.com/articles/strava-launches-redesigned-record-experience)
- [Strava — Run Activity Pages](https://support.strava.com/hc/en-us/articles/216919567-Run-Activity-Pages)
- [PeloBuddy — App target metrics](https://www.pelobuddy.com/app-target-metrics/)
- [LogRocket — Cognitive overload](https://blog.logrocket.com/ux-design/cognitive-overload/)
- [UX Movement — Destructive actions](https://uxmovement.com/buttons/how-to-design-destructive-actions-that-prevent-data-loss/)
- [GitLab Pajamas — Destructive actions](https://design.gitlab.com/patterns/destructive-actions/)

*Sourcing note: Apple HIG pages are JavaScript-rendered; the quoted HIG rules are taken from current search-engine extractions of those exact pages and are consistent with long-standing HIG guidance. Rauno Freiberg's and Emil Kowalski's guidelines were fetched verbatim. Specific accent hex values are design suggestions, not sourced claims — validate against AA contrast on `#1a0f08` before committing.*
