# Onboarding Psychology — Design Research (Prep Track 1)

Status: RESEARCH. Fulfills "Prep track 1 — Psychology" from
`05-onboarding-tour-credits-prep.md`. No code. Captured 2026-06-09.

The job: figure out the psychology that should drive Cadence's redesigned
first-run onboarding, feature tour, and credits — so the later growth-docs
session and spec start from evidence, not vibes. Each topic below: principle →
source → **Apply to Cadence**. Prioritized summary at the end.

The core loop to optimize for: **steps → matched music → "in the pocket."**
That moment — the music tempo locking onto your live cadence — is Cadence's aha.
Everything in onboarding should be in service of reaching it fast and honestly.

---

## 1. Activation & time-to-value (the "aha moment")

**Principle.** Users decide stay-or-go in hours, not weeks. Reforge frames
activation as three moments — *setup* → *aha* → *habit* — where the aha moment is
the first time a user takes the core action that delivers the value prop, and the
goal is to reach it fast then repeat it into a habit ([Reforge — Define your aha
moment](https://www.reforge.com/guides/define-your-aha-moment)). NN/g-aligned
onboarding research stresses that most abandonment happens in the first few
interactions, so value must arrive early and in-context rather than via long
up-front tutorials ([NN/g — Onboarding Tutorials vs. Contextual
Help](https://www.nngroup.com/articles/onboarding-tutorials/)). Time-to-value is
the lever: the longer it takes to deliver on the promise, the higher the churn
([Amplitude — Time to Value](https://amplitude.com/blog/time-to-value-drives-user-retention)).

**Apply to Cadence.**
- Define the aha explicitly as **first "in the pocket" moment** — music tempo
  visibly matched to live cadence. The whole first-run flow is a runway to that.
- Setup moment = the two must-haves: motion permission + Apple Music auth. Treat
  these as the *only* gating steps; everything else is deferred (see §2).
- Get to a real match within the first session, ideally first minute of moving.
  Avoid front-loading explanation; let the hero number + ring + matched track do
  the teaching once permissions clear.
- Don't declare victory at setup. The habit is *repeated* pocket moments across
  runs — the end-of-session summary and re-open/resume flow are where activation
  actually completes, so they matter as much as screen 1.

---

## 2. Progressive disclosure

**Principle.** Defer advanced/rare features to secondary moments so the first
screen isn't overwhelming. Nielsen introduced progressive disclosure in 1995 as a
way to satisfy two conflicting wants at once — power *and* simplicity — by
revealing features in context instead of dumping them ([NN/g — Progressive
Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)). Pair it
with "pull" revelations — contextual help (coachmarks, tooltips) triggered when a
user would actually benefit — rather than a front-loaded tour ([NN/g — Onboarding
Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/)).

**Apply to Cadence.**
- First run shows **only** what's needed to reach a match: what Cadence does (one
  line), motion priming, Apple Music priming, go. Nothing about pace sensitivity,
  half/double-time, pace lock, song switching, or guard rails up front.
- Put the feature tour *after* the first pocket moment, as contextual coachmarks
  that fire when the concept becomes relevant — e.g. surface "Matching N" chip
  explanation the first time perceived ≠ managed cadence; surface Pace lock the
  first time the user is on a steady (treadmill-like) cadence.
- Settings stay collapsed/secondary. Advanced concepts (half/double-time,
  pace sensitivity) live behind their controls with inline "why," not in onboarding.
- Make the tour skippable and re-triggerable from settings — pull, not push.

---

## 3. Permission priming (motion + Apple Music)

**Principle.** A pre-permission ("soft") screen shown *before* the OS dialog —
explaining the why and the value — measurably lifts grant rates, because iOS only
lets you fire the native prompt once and a cold prompt converts poorly. Industry
opt-in baselines sit ~40–45% for cold iOS prompts; a well-worded primer in front
can improve allow rates substantially ([Appcues — Mobile permission
priming](https://www.appcues.com/blog/mobile-permission-priming);
[OneSignal — iOS opt-in rates](https://onesignal.com/blog/how-to-create-more-compelling-opt-in-messages-for-ios/)).
Best practice: be specific about what you'll access, the value returned, and the
exact next action; ask at the most relevant moment ([Apple — Asking permission to
use notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)).

**Apply to Cadence.** Two priming screens, each *before* its system prompt:
- **Motion (CMPedometer).** Why-first: "Cadence reads your steps-per-minute to
  match music to your pace. It never tracks location." Then the native motion
  prompt. Frame it as the thing that *makes the app work*, not a generic
  permission.
- **Apple Music.** Why-first: "Cadence finds songs in your library whose tempo
  matches your stride." Then the MusicKit auth prompt. Set the expectation that
  it reads/queues from their own library.
- Order them right at the relevant moment (just before the first session), never
  both cold on launch. If a permission is denied, show a recoverable explainer
  with a Settings deep-link — not a dead end (and never re-fire; iOS won't allow it).

---

## 4. Motivation — SDT, endowed progress, Zeigarnik

**Principle — Self-Determination Theory.** Sustained motivation rests on three
needs: **autonomy** (feeling in control of choices), **competence** (feeling
effective/capable), and **relatedness** (connection/support). Designs that satisfy
all three see more engaged, motivated users ([NN/g — Autonomy, Relatedness, and
Competence in UX Design](https://www.nngroup.com/articles/autonomy-relatedness-competence/)).

**Principle — Endowed progress / Zeigarnik.** People given *artificial* early
advancement toward a goal persist more toward finishing it (Nunes & Drèze: a
10-stamp card with 2 pre-filled beat an 8-stamp-from-zero card by ~82%, same real
effort) ([Nunes & Drèze — The Endowed Progress
Effect](https://www.researchgate.net/publication/23547282_The_Endowed_Progress_Effect_How_Artificial_Advancement_Increases_Effort)).
The Zeigarnik effect explains the pull: once started, unfinished tasks nag at us
([Learning Loop — Endowed Progress](https://learningloop.io/plays/psychology/endowed-progress-effect)).
Starting a multi-step flow's progress bar at ~10–20% (not zero) raises completion.

**Apply to Cadence.**
- **Autonomy:** keep onboarding skippable where safe; let the user feel they're
  choosing to run, not being processed. Pace sensitivity and matching toggles
  (already in the product) are autonomy levers — surface them later, contextually,
  not as a setup gauntlet.
- **Competence:** the hero number + in-the-pocket ring already deliver a
  competence signal ("my steps are landing on the beat"). Onboarding should set
  this up so the *first* pocket moment reads as a small win, not a confusing flash.
  The end-of-session summary is a competence moment — reflect effort honestly.
- **Relatedness:** lowest-stakes need here (Cadence is solo/personal). The
  **credits screen** (Zernell) is a light relatedness/authenticity touch — "made by
  people" — not a social-graph play. Don't manufacture fake social pressure.
- **Endowed progress / Zeigarnik:** if the first-run flow uses a step indicator,
  start it partly filled (e.g. step 1 of 3 already showing progress, not "0%").
  **Caveat:** the product deliberately has *no session-progress bar* (a run is
  open-ended — see CONTEXT.md). Endowed progress applies to the *finite onboarding
  flow only*, never to the running session. Don't invent a progress bar for the run.

---

## 5. Honesty constraint — claims must be evidence-backed

**Principle.** The music-and-exertion science is real but bounded; overclaiming
erodes trust (and trust loss is the documented cost of dark patterns — §6).
Karageorghis et al.'s synthesis is the authority: motivational/synchronous music
during repetitive endurance work can enhance affect, reduce ratings of perceived
exertion (RPE typically lowered ~10% at low-to-moderate intensity for
asynchronous music), improve energy efficiency, and raise work output; synchronous
music produced ergogenic effects exceeding neutral music ([Karageorghis & Priest —
Music in the exercise domain, Part II,
PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3339577/);
[Part I, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3339578/)).

**The trap.** A specific finding (one cited study showed a ~15% increase in
time-to-exhaustion for motivational vs. no-music control under particular
conditions) is *not* a general law and **must not** be flattened into a marketing
claim like "+15% endurance." Karageorghis himself notes earlier predictions about
music and perceived exertion were *not* borne out by later research — the effect is
conditional (intensity, sync, music selection), not guaranteed.

**Apply to Cadence.**
- Onboarding copy talks about what users will *feel/experience* ("music that lands
  on your stride," "get in the pocket"), not quantified performance promises.
- **Banned:** any hard stat ("+15% endurance," "run 15% longer," "X% less
  effort"). If a science claim is ever used, hedge it to the literature ("research
  suggests music matched to your pace can make effort feel easier") and cite
  Karageorghis. Cross-check against
  `docs/ideas/smart-recommendations-music-science.md` grading before shipping copy.
- Position the benefit as *experiential and honest* — the match feels good and
  keeps you moving — which is both true and more durable than a fake number.

---

## 6. Retention hooks WITHOUT dark patterns

**Principle.** Dark patterns (confirmshaming, roach-motel cancellation, forced
continuity, fake urgency) can lift short-term metrics but reliably cost trust,
reputation, and increasingly carry legal risk — by 2022 ~97% of top EU apps/sites
used at least one ([Scalable Path — Dark pattern
examples](https://www.scalablepath.com/ui-ux-design/dark-pattern-examples)).
Ethical alternatives center informed consent and an easy exit — respecting the
user's right to leave is the clearest ethical line ([Raw.Studio — Designing with
Integrity](https://raw.studio/blog/designing-with-integrity-the-ethical-designers-handbook-on-dark-patterns/)).
The legitimate version of a "hook": Duolingo defers signup until *after* the first
real lesson and a streak Day 1 — "try before you buy into the habit" — which lifted
next-day retention ~20% ([Juno School — Duolingo onboarding
masterclass](https://www.junoschool.org/article/duolingo-onboarding-experience/);
[Deconstructor of Fun — Duolingo
streaks](https://duolingo.deconstructoroffun.com/mechanics/streaks)).

**Apply to Cadence.**
- **Gradual engagement, Duolingo-style:** let the user reach a real pocket moment
  with as little gating as possible. Deliver value before asking for anything
  optional. Required asks are only the two permissions (§3).
- **Honest competence hooks, not manufactured ones:** the end-of-session summary
  (real elapsed time, real cadence) is the retention surface — reflect genuine
  effort. Resume-on-reopen (a session survives backgrounding) is a *helpfulness*
  hook, not a trap.
- **Hard "no" list:** no fake streaks pressuring daily runs, no confirmshame on
  skip/exit, no buried "End session" (it's already a deliberate hold-to-end — keep
  it discoverable), no notification guilt-trips, no fabricated urgency.
- The **End session** control and any future cancellation/exit must stay obvious —
  honoring the right to leave is the ethical baseline.

---

## Prioritized summary — what the spec should adopt

1. **Define the aha as the first "in the pocket" moment** and design the entire
   first run as a short runway to it. Setup = motion + Apple Music only. (§1)
2. **Two why-first permission primers** (motion, then Apple Music), each before its
   native prompt, fired at the relevant moment — not cold on launch. Recoverable
   denial states with Settings deep-links. (§3)
3. **Progressive disclosure:** strip onboarding to essentials; move the feature
   tour to *contextual coachmarks* after the first match; keep it skippable and
   re-triggerable. (§2)
4. **Honesty firewall on copy:** experiential language only; ban quantified
   endurance/effort stats; hedge + cite Karageorghis if science is referenced.
   Gate copy through the music-science grading doc. (§5)
5. **Ethical hooks only:** gradual engagement (value before optional asks), honest
   end-of-session reflection, easy exit. No fake streaks, confirmshame, or urgency. (§6)
6. **SDT + endowed progress, applied narrowly:** start the *onboarding* step
   indicator partly filled (Zeigarnik pull); use the hero number/ring/summary as
   genuine competence signals; treat credits as light relatedness. **Never** add a
   progress bar to the open-ended running session. (§4)
