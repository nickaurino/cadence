# 03 — Ubiquitous Language (Cadence Design Glossary)

A shared vocabulary for the Cadence app revamp. The goal is simple: when Nick and the team say "the wheel," "the ring," "pace lock," or "amber," everyone pictures the same thing — in design reviews, grill sessions, and code. Each term has one or two crisp definitions and, where relevant, a concrete recommendation drawn from the research.

**Rule of thumb:** prefer the term in the **Canonical** column. Avoid the terms in **Don't say** — they're ambiguous or carry the wrong mental model.

---

## 1. Screen Names

Cadence is three screens. Name them precisely so we never confuse a system placeholder with a real screen, or a picker with an onboarding wizard.

| Canonical | What it is | Don't say |
|---|---|---|
| **Launch Screen** | The near-instant placeholder iOS shows while the app boots. Per Apple, "its sole function is to enhance the perception of your experience as quick to launch" — not branding, not a splash, no lingering logo. ([Apple HIG — Launching](https://developer.apple.com/design/human-interface-guidelines/launching)) | "Splash screen" |
| **Home** (a.k.a. **Start Screen**) | The recurring landing screen with the single primary call-to-action. One "Start Run" hero in the thumb zone over a warm dark field; an optional "Resume last session" as the secondary action. | "Get Started page," "dashboard" |
| **Selector** | The single-screen vibe + pace picker. A fast 2-axis selection screen, **not** an onboarding flow or settings form. Pre-selects the last-used combo so it's optional refinement, not a gate. | "Setup," "onboarding," "wizard" |
| **Active Screen** (a.k.a. **Now-Playing / Live Session**) | The full-screen in-app session view, built for glanceability at arm's length mid-stride. Hero SPM, secondary metrics, now-playing block, accident-proof controls. ([Apple — Live Activities, WWDC23](https://developer.apple.com/videos/play/wwdc2023/10194/)) | "Workout screen," "player" |
| **Summary** | The post-run recap. Avg cadence + distance/time/pace hero, a cadence-over-time chart annotated with songs, splits list, route map. Auto-saved. ([Strava — Run Activity Pages](https://support.strava.com/hc/en-us/articles/216919567-Run-Activity-Pages)) | "Results," "stats page" |
| **Live Activity** | The system-surface companion (Lock Screen, Dynamic Island, Watch) mirroring the Active Screen's hierarchy — SPM + track — so runners control playback without unlocking. ([Apple — WWDC23](https://developer.apple.com/videos/play/wwdc2023/10194/)) | "Widget," "notification" |

**Adjacent terms to keep straight** (Apple draws hard lines between these):
- **Onboarding** — a brief first-run flow, capped at three screens and skippable. Cadence has *no* onboarding carousel; cadence-matching is explained in a one-line caption under the Start button if at all. ([Apple HIG — Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [NN/g — Mobile-App Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/))
- **Contextual permission prompt** — asking for Apple Music / Motion & Fitness access *at first need* (when the user taps Start), never as a cold wall before the user sees value.

---

## 2. UI Components

| Canonical | What it is | Don't say |
|---|---|---|
| **The Wheel** / **Pace Picker** | The continuous pace/cadence control on the Selector. A **slider with a live SPM readout** that also shows the matched BPM, so "faster pace → higher-tempo songs" is felt, not abstract. Continuous values want sliders, not dropdowns or picker-wheels. ([Material 3 — Selection](https://m3.material.io/foundations/interaction/selection)) | "Dropdown," "spinner" — and avoid an actual rotary wheel UI for this |
| **Vibe** | The single-select mood axis on the Selector — a small set (e.g. **Chill · Steady · Push**, 3–5 options) shown as a **segmented control or chip row**. Segmented controls fit 2–5 mutually exclusive short labels with one tap and all options visible. ([Selection Control Cheat Sheet](https://medium.com/design-group-italia/the-ultimate-selection-control-cheat-sheet-dde495365d55)) | "Genre," "mode," "preset" |
| **Selected State** | The unmistakable highlight on the active vibe segment. Material's #1 rule: "it should be visible at a glance whether a control is selected." This is where the energized accent earns its keep. ([Material 3 — Selection](https://m3.material.io/foundations/interaction/selection)) | "Highlighted," "the lit one" |
| **Start Button** | The single filled, bottom-anchored primary CTA. Verb-first copy that names the action — **"Start Run"** or "Match My Cadence," never "Get Started" or "Continue." ([NN/g — Get Started Stops Users](https://www.nngroup.com/articles/get-started/), [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)) | "CTA," "Get Started," "Go" |
| **Progress Ring** | A closed-loop radial indicator that fills toward a **goal** (target distance/time). Use it only when a goal exists; it wraps the hero SPM number so the ring is dial and progress meter at once. ([Apple HIG — Activity Rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings)) | "Circle," "dial" (when no goal) |
| **Cadence Band** / **Zone Gauge** | The always-on thin arc or tick gauge behind the hero number showing the **target SPM band** (e.g. 160–170) with a live indicator of where the runner sits — borrowed from Peloton's target metric ranges. Answers "am I in the zone the music is set to?" ([PeloBuddy — target metrics](https://www.pelobuddy.com/app-target-metrics/)) | "Meter," "the bar" |
| **Progress Bar** | The slim **linear** track at the bottom for a free run with no goal — tied to the now-playing **song's** progress, so progress feels present without faking a fitness goal. | "Loading bar" |
| **SPM Hero** | The live steps-per-minute readout — the single **largest** element on the Active Screen (64–80pt) and Cadence's whole reason to exist. Uses tabular figures so digits don't jitter. | "The big number" (in code) |
| **Secondary Trio** | The quieter row beneath the hero: **time · distance · pace** (NRC's proven set), ~28–32pt. ([Nike — NRC features](https://www.nike.com/help/a/nrc-run-features)) | "The stats" |
| **Tempo Chip** | The collapsed pill at the lower edge of the Active Screen showing target SPM + a metronome glyph. Taps/drags open to reveal the manual pace slider, an **auto-match** toggle, and now-playing transport. Default is auto; manual is the one-tap escape hatch. | "Mini player," "the controls" |
| **Pace Lock** / **Cadence Lock** | Two distinct meanings — keep them separate: **(a) Screen Lock** — a padlock toggle that disables touch targets (hides *controls*, keeps *data* live) to prevent accidental pauses, mirroring NRC's water-lock. ([Nike — NRC features](https://www.nike.com/help/a/nrc-run-features)) **(b) Cadence-Lock moment** — the celebratory beat when live SPM matches target. | "Freeze," "lock" (unqualified) |
| **Status Pill** | The small, quiet read-out of the current vibe + pace on the Active Screen, e.g. "Push · 165 SPM," so the runner knows what's playing without re-entering the Selector. | "Badge" |
| **Slide-to-End** | The bottom "▸ slide to finish" track that ends a session. The gesture *is* the confirmation — friction that kills the accidental-end problem. Physically distinct from **hold-to-pause**. ([UX Movement — destructive actions](https://uxmovement.com/buttons/how-to-design-destructive-actions-that-prevent-data-loss/)) | "Stop button," "End button" |
| **Advanced (disclosure)** | The collapsed section on the Selector hiding genre, explicit filter, and playlist source — kept off the two primary axes. | "Settings," "options" |

**Button hierarchy vocabulary** (Refactoring UI / Apple HIG — one filled button per screen):
- **Primary** — filled amber/ember, dark walnut label, bottom-anchored, ≥44pt tap target. ("Start Run")
- **Secondary** — outlined, walnut-grain border, cream label. ("Walk instead")
- **Tertiary** — text-only, muted. ("Skip," "Settings")
- **Destructive** — kept quiet (muted text / outline), never a loud red fill; gated by deliberate intent (slide/hold). ("End Run")

---

## 3. Motion Terms

The whole team should use the same words for motion so "make it snappier" has a precise meaning. Four governing rules from the source consensus: **ease-out for entrances; keep it short (<300ms, sheets ≤400ms); animate only transform + opacity; don't animate frequent interactions.**

| Canonical | What it means |
|---|---|
| **Easing** | The acceleration curve of an animation. **Ease-out** (decelerate) is the default for anything entering or moving on-screen — "it accelerates at the beginning which gives the user a feeling of responsiveness." ([Emil Kowalski — 7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips)) |
| **Decelerate / Accelerate / Standard** | Named curves: decelerate `cubic-bezier(0,0,0.2,1)` for entrances; accelerate `cubic-bezier(0.4,0,1,1)` for exits; standard `cubic-bezier(0.4,0,0.2,1)` for moves within a screen. ([Material — Duration & Easing](https://m1.material.io/motion/duration-easing.html)) |
| **Spring** | Physics-driven motion (not fixed-duration) that makes UI feel alive. SwiftUI presets: **`.snappy`** (control feedback, light bounce), **`.smooth`** (ambient/data settle, no bounce), **`.bouncy`** (reserved for the cadence-lock celebration only). ([Nil Coalescing — SwiftUI timing](https://nilcoalescing.com/blog/AnimationTimingInSwiftUI/)) |
| **Micro-interaction** | A small, single-purpose animated response to a user action — a button press, a selection checkmark, a digit roll. Should feel immediate (≤200ms) and proportional. ([Rauno Freiberg — Interfaces](https://github.com/raunofreiberg/interfaces)) |
| **Press State** | The intentional scale-down on press: scale to **~0.96–0.97**, not 1→0.8, paired with a slight opacity dip. The iOS gray tap-highlight is disabled and replaced by this. ([Rauno Freiberg](https://github.com/raunofreiberg/interfaces)) |
| **Interruptible** | A motion that the user can override mid-flight — tap Start then immediately tap Stop without waiting for the start animation to finish. ([Emil Kowalski — Great Animations](https://emilkowal.ski/ui/great-animations)) |
| **Origin-aware** | A transition that scales/expands *from the element that triggered it* (correct `transform-origin`), not from screen center — e.g. the Active Screen revealing from the Start button's position. ([Emil — 7 Tips](https://emilkowal.ski/ui/7-practical-animation-tips)) |
| **Breathing Pulse** | The slow, continuous `scale` (e.g. 1.0↔1.03) on the cadence ring synced to *target* cadence — the one place a running app earns living, ambient motion (a metronome you feel). |
| **Cadence-Lock Celebration** | The single celebratory moment: a `.bouncy` pop on the ring + one success haptic + the accent easing in, when live SPM locks to target. Spend the bounce budget here and nowhere else. |
| **Odometer / Roll** | A short vertical digit roll (~150ms ease-out) when a *changing* metric updates (SPM, pace). Distinct from *counting* metrics (elapsed clock) which update instantly — never roll the clock. |
| **Haptic** | Tactile feedback treated as part of one feedback system with motion and sound — e.g. a single medium impact on run start, a light/selection tap on vibe selection. ([Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)) |
| **Reduce Motion** | The accessibility setting that swaps movement for opacity fades. Mandatory here — it's also vestibular safety, since the user is physically moving while glancing at the screen. ([Emil — Great Animations](https://emilkowal.ski/ui/great-animations)) |

**Duration tokens to share** (from the research token sheet): `fast 150ms` (digit rolls, glyph crossfades) · `enter 225ms` · `exit 195ms` · `base 300ms` · `sheet ~400ms` (playlist sheet; >400ms feels slow) · `hold 800–1000ms` (hold-to-stop only).

---

## 4. Color Roles

Cadence **evolves** the George walnut/cream palette and **replaces** the Spotify-ish green `#1DB954`. We name colors by **role**, not by hex, so the role survives a re-tune. The discipline is **60-30-10**: walnut surfaces are the calm 60/30, neutrals are quiet, and the energized accent is the disciplined ~10% reserved for the live/active state.

| Role | Token / value | What it's for |
|---|---|---|
| **Background** | `#1a0f08` (Walnut Undercoat) | The deepest surface — a warm near-black, never pure black. The "track" everything rests on. |
| **Surface** | `#2e1a0e` (Walnut Coat) | One step up the elevation ramp: cards, sheets, the tempo chip. Elevation = lighter + warmer, not shadows. |
| **Border / Grain** | `#4a2e18` (Walnut Grain) | Hairline borders and the next elevation step; secondary (outlined) button borders. |
| **Text** | `#e8ddd0` (Bed Light, cream) | Primary labels and the single most important live value (SPM hero, in-zone state). 14:1 contrast on background. |
| **Muted** | `#8a7060` | Secondary/inactive labels, tertiary "Skip/Cancel" text, off-cadence state. Large-text/non-text contrast only — never body. |
| **Accent (resting)** | `#c8b89a` (Bed Medium) | The calm, on-brand warm sand for quiet active states. Too low-contrast to carry the primary CTA on its own. |
| **Accent (live / energized)** | **Ember Coral `#F0764B`** (lead recommendation) | The one energized warm — reserved for **exactly one thing per screen**: the primary CTA fill, the live SPM hero, the active vibe segment, the on-beat ring. Scarcity is what makes it read premium. Passes WCAG AA (6.63:1 on background; supports dark `#1a0f08` label on the fill). |
| **Accent Dim / Pressed** | `accentDim #3d2a1a` / Ember dim `#7A3A22` | Pressed and disabled fills (e.g. the disabled "Start Run" while GPS/audio spins up) and ring tracks, so resting state visibly recedes. |
| **Accent Pulse** | `#FF8A5C` | The brief on-beat flash at the cadence-lock moment. |
| **Accent Premium (optional secondary)** | Brass Gold `#D4A24E` | Achievement / streak / PR moments only — a tasteful two-warm system. Coral = live energy; gold = achievement. ([Colorhero — dark palettes 2025](https://colorhero.io/blog/dark-mode-color-palettes-2025)) |

**Why ember, not green:** the green fights the warm palette, reads as a Spotify clone, and is high-chroma noise. Ember Coral stays in walnut's documented "fire" family (rust/terracotta/copper) but spikes a saturation George never reaches elsewhere — related but distinct, and it *means* "you're in the pocket, your steps match the beat." ([NV Gallery — walnut pairings](https://www.nvgallery.com/en/blogs/magazine/walnut-wood-the-ideal-color-combinations-and-palettes-to-highlight-it/), [Supercharge — color harmonies](https://supercharge.design/blog/color-harmonies-in-ui-in-depth-guide))

**Color-as-feedback (the core rule):** drive accent **intensity off match-state**. In-sync → full Ember Coral, pulsing on the beat. Drifting off-cadence → desaturate toward muted `#8a7060`. The color *is* the feedback loop.

**Contrast law:** the live accent must clear **4.5:1** as text/numerals and **3:1** as a control against `#1a0f08`. Use dark walnut (`#1a0f08`) labels on accent fills — never cream — for the premium, legible button. ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/))

**Apple Music color note:** Apple Music's red/pink belongs only inside the official, unaltered "Listen on Apple Music" badge. Don't recolor or rebuild it; Cadence's ember is Cadence's. ([Apple Music Identity Guidelines](https://marketing.services.apple/apple-music-identity-guidelines))

---

## 5. Quick "Say This, Not That"

| Say | Not |
|---|---|
| Selector | Onboarding, setup, wizard |
| The Wheel / Pace Picker (a slider) | Dropdown, spinner |
| Vibe | Genre, mode |
| SPM Hero | The big number |
| Progress Ring (goal) vs. Progress Bar (song) vs. Cadence Band (zone) | "the meter" for all three |
| Screen Lock vs. Cadence-Lock moment | "lock" (unqualified) |
| Tempo Chip | Mini player |
| Slide-to-End | Stop / End button |
| Accent (live) = Ember Coral | "the green," "the highlight color" |
| Press State (scale ~0.96) | "the tap animation" |
| Ease-out / Decelerate | "make it smooth" |
