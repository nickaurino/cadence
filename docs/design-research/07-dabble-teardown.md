# Dabble Teardown — Onboarding + Feature Tour (Prep Track 2)

Status: RESEARCH. Fulfills "Prep track 2 — Dabble teardown" from
`05-onboarding-tour-credits-prep.md`. References the recommendations in
`06-onboarding-psychology.md`. No code. Captured 2026-06-09.

"Dabble" = Nick's hobby-randomizer app (`~/Desktop/hobby-randomizer/`). This is a
read of the *actual shipped code*, not the marketing. Two systems studied: the
first-run onboarding flow, and the in-app interactive feature tour. For each
pattern below: what it does → **borrow / adapt / skip for Cadence**.

Note on a code-vs-doc gap: `components/FeatureTour.tsx` (a simple 3-step centered
modal card) exists but is **not mounted** anywhere. The *shipped* tour is the
interactive spotlight system in `lib/TourContext.tsx` + `components/SpotlightOverlay.tsx`,
driven per-screen. The ADR (`docs/adr/001-feature-tour.md`) describes this shipped
system (8 logical steps; the code splits filter/search so the enum lists 9). Treat
`FeatureTour.tsx` as a dead earlier draft; everything real is the spotlight path.

---

## 1. Onboarding flow & pacing

**Mechanism.** `onboarding/OnboardingFlow.tsx` — a single full-screen component, not
a router stack. Local `index` state steps through a hardcoded `SLIDES` array.
`OnboardingSlide.tsx` is a dumb presentational headline+body. **3 slides**, no
images, no inputs, no permissions:

1. *"Your free time should feel good."* — value framing (why hobbies matter).
2. *"Boredom is a signal, not a problem to numb."* — the worldview / anti-scroll thesis.
3. *"Don't take yourself too seriously."* — expectation-setting before the core loop.

**Pacing.** Pure philosophy, zero feature explanation. The slides teach *mindset*,
not mechanics — mechanics are deferred to the in-app tour (good progressive
disclosure). `skip` link top-right on every slide (calls `finish()` immediately).
Footer = progress dots (active dot widens to 18px + accent color) + a button that
reads `Next` until the last slide, then `Let's go`.

**Persistence.** `setOnboarded()` writes AsyncStorage key `'onboarded'`
(`lib/storage.ts`). Replay: `resetOnboarded()` / `triggerOnboardingReplay()`.

**First-run gate.** In `app/_layout.tsx`: load `getOnboarded()` + `getTourShown()`,
render `null` while loading (avoids flash). If `!onboarded` → render `<OnboardingFlow>`
*instead of* the router tree (hard gate, not a route). On done, flip state → app
tree mounts → `TourProvider initialActive={!tourShown}` so the tour auto-fires once,
right after onboarding.

**Permissions.** None. hobby-randomizer asks for *no* runtime permissions, so there
is **no permission-priming pattern to borrow** — Cadence has to design its two
primers (motion, Apple Music) from the psychology doc §3, not from here.

---

## 2. Feature tour mechanism (the good part)

**Type.** Not a modal carousel — a **per-screen interactive spotlight tour**. Each
participating screen renders its own dimming overlay with a cutout around a *real,
measured* UI element, and most steps **advance only when the user performs the real
action** (press Spin, tap the landed row, double-tap Track). It teaches by making
you do the thing.

**State (`lib/TourContext.tsx`).** A React context (`TourProvider`) holds `active`,
`step` (the `TOUR_STEP` enum), plus tour-scoped data: `landedHobby`, `isSpinning`.
`advance()` increments the step and auto-`end()`s after the last (`SEARCH`).
`TOUR_STEP` enum, in order: `SPIN, SLOT, TAGS, TRACK, EXIT, MY_HOBBIES_TAB,
MY_HOBBIES, FILTER, SEARCH`. Spans 3 screens — `(tabs)/index`, `hobby/[id]`,
`(tabs)/my-hobbies`.

**Target registration / measurement.** No magic registry. Each screen keeps `ref`s
on its targets and a `measureAndAdjust(ref, setter)` helper that calls native
`ref.current.measure(...)` → `{x,y,width,height}` (`TargetRect`). Crucially it
normalizes against a once-measured **root safe-area offset** (`rootRef.measure` in
`onRootLayout`) so rects land in the overlay's own coordinate space. Measurement is
re-run on step change via effect, and `onLayout` is used for the first-launch case
("fires after the element has real dimensions — reliable on first launch"). The
strip is *pre-measured* during SPIN so SLOT shows with no flash.

**Spotlight rendering (`components/SpotlightOverlay.tsx`).** No SVG. The cutout is
faked with **4 dark panels** (top/bottom/left/right) at `rgba(0,0,0,0.82)` around the
`targetRect` with 5px padding. A floating copy card auto-positions above or below
the target (`targetRect.y < SCREEN_H * 0.45` → card below). `targetRect=null` →
full dark overlay, no cutout (used for the EXIT step). `passthroughBackground`
toggles `pointerEvents="none"` on panels so the user can still scroll/tap underneath
when the step is informational.

**Advance model.** Action-driven, not Next-driven, for the meaty steps: SPIN waits
for the real Spin press, SLOT waits for the tap on the landed row, TRACK waits for a
double-tap to "Trying It", EXIT waits for the modal close (nav event), TAGS
**auto-advances after 2.5s** then auto-scrolls. Only FILTER/SEARCH use a plain Next
button. Scroll is **locked** (`scrollEnabled={false}`) only during TRACK so the user
can't wander.

**Tab-bar control (`app/_layout.tsx` `TabBarDimmer`).** During tab-relevant steps a
90px dark `View` with `pointerEvents="box-only"` covers the tab bar — absorbs taps so
off-path tabs aren't pressable. Clean way to constrain navigation without disabling
the router.

**Skippable / re-triggerable.** Skip is present on every step (top-right). State
persists via `'tour_shown'` AsyncStorage key (`getTourShown`/`setTourShown`).
Re-trigger from Settings: `handleReplayTour` → `resetTourShown()` →
`router.replace('/(tabs)')` → `triggerFeatureTour()`. The trigger plumbing avoids
prop-drilling via **module-level setters** registered by the provider
(`registerTourSetters`, `triggerTourStart` in `TourContext.tsx`; `featureTourState.ts`
and `onboardingState.ts` are thin shims so Settings doesn't import the context).

**ADR decision + rationale (`docs/adr/001-feature-tour.md`).** Decision: a "fully
interactive, multi-screen feature tour that re-renders its own overlay on each
participating screen. Each step waits for a real user action before advancing.
There is always a visible Skip button." Rationale: walk users through the app *the
way the maker uses it* ("spin, commit to reading whatever you land on, track it,
find it later"). Explicit constraints: spotlight = 4 panels, **no react-native-svg**;
scroll-lock isolated to one prop on one ScrollView; **no new libraries**. Consequence
accepted: each participating screen needs minor tour-awareness + ref plumbing.

---

## 3. Copy — tone and length

**Onboarding** is essayistic and opinionated — 1 short headline + a 1–4 sentence
body. Real strings:

- *"Boredom is a signal, not a problem to numb. Scrolling gives your brain just
  enough stimulation to quiet it, but nothing actually changes. You're not less
  bored, you're just distracted from it."*
- *"The best hobbies usually look a little ridiculous from the outside. Come in with
  an open mind and low expectations. … Best case, you find something you actually
  love. Not a bad bet."*

Confident, second-person, no jargon, faintly contrarian. It sells a *worldview*,
not features.

**Tour** copy is terse, imperative, one line per step (from ADR):

- *"This is how it starts. Hit Spin and let the app decide."*
- *"You landed on [hobby.name]. Tap it to explore."* (interpolates live data)
- *"Tap this twice to mark it as Trying It."*
- *"Scroll up and tap X to go back."*

Tour = instructions; onboarding = persuasion. Two registers, deliberately.

---

## 4. Visual style — what makes it feel premium

- **Restraint.** Type-and-space only. No illustrations, no stock art. Big headline
  (`fontSize.xl` 28, weight 700, lineHeight 34), muted body (lineHeight 26), generous
  `spacing.xl` padding, content vertically centered.
- **One accent, used sparingly.** Single accent color for the CTA and the active
  progress dot; everything else muted/border tones.
- **The widening dot.** Active progress dot animates wider (6→18px) + accent — a tiny,
  premium-feeling progress signal. Reused identically in both onboarding and the
  (dead) FeatureTour card.
- **Motion = spotlight, not decoration.** The premium feel in the tour comes from the
  cutout tracking a *real measured element* and steps gated on *real actions* — it
  feels like the app is guiding your hands, not playing a slideshow. The 2.5s
  auto-advance + auto-scroll on TAGS adds a "it's doing it for me" beat.
- **Haptics.** `expo-haptics` is used in `components/SlotStrip.tsx` (not in onboarding/
  tour). A `triggerHaptic` wrapper gates a respect-reduced-motion-style guard, then:
  `ImpactFeedbackStyle.Light` on tick, `.Medium` on landing, decaying light taps as
  the wheel settles, and `NotificationFeedbackType.Success` on final land. The lesson
  for Cadence: haptics belong on the **core-loop payoff moment**, not the tutorial.

---

## 5. Borrow vs. adapt vs. skip for Cadence

Cadence visual system is locked: Onyx `#0c0c0d` + Marigold `#EFA836`, ring motif,
`PressableScale` / `SettingsButton` / `CadenceRing` / `HoldToEnd`, `SafeAreaView`.

| Pattern | Verdict | Notes |
|---|---|---|
| Hard first-run gate in root layout (render flow instead of router tree; `null` while loading) | **Borrow as-is** | Cadence already has `hasCompletedOnboarding()` + `app/index.tsx` routing — same shape. Keep the no-flash `null` load. |
| 3 philosophy-only onboarding slides, mechanics deferred to tour | **Adapt** | Cadence's psychology doc §1/§2 says strip onboarding to the *aha runway*: one line of what-it-does + the two permission primers + go. So 1 worldview line, **not** 3 essay slides — move teaching into contextual coachmarks. |
| Onboarding copy register (confident, experiential, second-person) | **Borrow (tone), adapt (content)** | Exactly the voice the honesty firewall (§5) wants — experiential, no numbers. Reuse the tone; ban any quantified endurance/effort claim. |
| Widening accent progress dot | **Adapt** | Recolor to Marigold on Onyx. Ties to endowed-progress (§4): start the indicator partly filled, not at 0. |
| Skip on every step + re-trigger from Settings | **Borrow as-is** | Directly satisfies §2 "skippable and re-triggerable" and §6 "easy exit." |
| Persist via AsyncStorage flags (`onboarded`, `tour_shown`) | **Adapt** | Use Cadence's existing `src/storage/store.ts` instead of a new key store. Mirror the two-flag split (onboarding done vs. tour seen). |
| Interactive spotlight tour fired *immediately after onboarding* | **Adapt → defer** | hobby-randomizer auto-fires the tour right after onboarding. Cadence psychology §2/§3 says **move the tour to contextual coachmarks fired after the first "in the pocket" moment** — value first, teaching second. Keep the spotlight *mechanism*, change the *trigger* from "post-onboarding" to "post-first-match / when-relevant." |
| 4-panel no-SVG spotlight cutout | **Borrow as-is** | No new deps, plays fine on Onyx. The dark panel at `rgba(0,0,0,0.82)` already reads as Onyx. |
| Action-gated advance (do the real thing to proceed) | **Borrow (selectively)** | Great for "press to start a session." But Cadence's coachmarks should be lighter (single tap-to-dismiss tooltips per §2), not a forced multi-screen gauntlet — use action-gating only on the first start-session press. |
| `TabBarDimmer` box-only nav lock | **Adapt / mostly skip** | Cadence's first run is mostly a single core screen; heavy nav-locking is overkill. Pull it out only if a coachmark must force a single next tap. |
| Auto-advance + auto-scroll (TAGS) | **Skip** | Cadence's "keep motion safe: one animation driver per view" rule (CadenceRing/PressableScale) makes auto-scroll-during-overlay risky. Prefer explicit dismiss. |
| Module-level setter shims (`featureTourState.ts`, `onboardingState.ts`) | **Borrow as-is** | Clean pattern for letting Settings trigger replay without prop-drilling or importing the context. Lift nearly verbatim. |
| Haptics on the payoff moment (SlotStrip pattern) | **Borrow (pattern), adapt (placement)** | Put `expo-haptics` Success on the **first "in the pocket" lock**, not the tutorial — that's the aha (§1) and the honest competence hook (§6). |
| Permission priming | **No source — design fresh** | hobby-randomizer asks for nothing. Build the two why-first primers (motion, then Apple Music) per psychology §3 from scratch; no pattern to copy here. |

---

## 6. Reusable code — lift or close-port

Concrete files worth porting (paths in `~/Desktop/hobby-randomizer/`):

- **`components/SpotlightOverlay.tsx`** — the whole 4-panel cutout + auto-positioning
  copy card. Self-contained, no deps beyond RN + theme. Re-theme to Onyx/Marigold and
  use almost as-is. Note its `TargetRect` interface and the `cardBelow` /
  `passthroughBackground` props.
- **`lib/TourContext.tsx`** — the context shape (`active`/`step`/data + `advance`/`end`),
  the `TOUR_STEP` enum convention, and especially the **module-level setter
  registration** (`registerTourSetters` / `triggerTourStart`) for prop-drill-free
  replay. Port the structure; replace the hobby step list with Cadence's coachmark set.
- **`lib/featureTourState.ts` + `lib/onboardingState.ts`** — 5-line shims that let
  Settings trigger tour/onboarding replay. Lift verbatim (rename keys).
- **`app/_layout.tsx`** — the gate logic: parallel-load both flags, render `null` while
  loading, render onboarding-instead-of-router when not onboarded, wrap the app in a
  provider with `initialActive` from storage. Copy the control flow.
- **The measurement helper pattern** in `app/(tabs)/index.tsx` — `rootRef.measure` for a
  one-time safe-area offset + per-target `ref.measure` normalized against it, with
  `onLayout` for first-launch reliability and pre-measuring to avoid flash. Not a file
  to copy wholesale, but the *technique* is the load-bearing part of making spotlights
  land correctly on Cadence's screens.

---

## What the spec should adopt

1. **Lift the spotlight mechanism, change the trigger.** Port `SpotlightOverlay.tsx`
   + `TourContext.tsx` structure, but fire coachmarks **after the first in-the-pocket
   moment**, not auto on post-onboarding (psychology §2).
2. **Cut onboarding to the aha runway.** One worldview line + two why-first permission
   primers + go — not 3 essay slides. Borrow hobby-randomizer's *tone*, not its length
   (§1, §5 honesty firewall).
3. **Reuse the plumbing verbatim.** Hard gate in root layout, two AsyncStorage flags,
   module-level setter shims for Settings replay, Skip on every step. These satisfy
   "skippable + re-triggerable + easy exit" for free (§2, §6).
4. **Haptics on the payoff, not the tutorial.** Put the Success haptic on the first
   cadence lock — the honest competence hook (§1, §6).
5. **Design permission priming from scratch.** No pattern exists in hobby-randomizer;
   build the motion + Apple Music primers per psychology §3, each before its native
   prompt, with recoverable denial states.
