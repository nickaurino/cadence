# 04 — Grill Prep: Cadence App Revamp

> **Purpose.** This doc converts the design research into sharp, decision-forcing questions for `/grill-with-docs` sessions. Each section targets one open issue, states the **decision at stake**, gives a **starting recommendation** (so the grill has a position to attack), and lists **pointed questions** that force trade-offs — not yes/no comfort checks.
>
> **How to use it.** Run one grill per section. Don't leave a section until every question has a *committed* answer written into the design system or a spec. A question is only "answered" when you can say what you gave up to get it.
>
> **Standing constraints (true across all sections):**
> - App #3 must read as a **sibling** of the George Theme, not a clone — walnut/cream bones (`#1a0f08`, `#2e1a0e`, `#4a2e18`, `#e8ddd0`, muted `#8a7060`), evolved accent.
> - Kill the Spotify green `#1DB954`.
> - The runner glances for **<1 second**, moving, sweaty-thumbed, in sunlight. Glanceability beats completeness everywhere.
> - Anything that animates per-frame is `transform`/`opacity` only, profiled at 60fps over a full run.

---

## 1. Screen flow & information architecture

**Decision at stake:** How many screens, in what order, and where do permissions, onboarding, and "resume" live? The failure mode is turning Home into a generic "Get Started" wall or the Selector into a multi-screen wizard.

**Starting recommendation:** Three screens — **Home** (single "Start Run" hero in the thumb zone over a warm dark field, "Resume — Sunset 7:00 pace" as the *only* secondary action), **Selector** (one screen, two axes, no Next buttons), **Active**. No onboarding carousel. Apple Music + Motion/Fitness permissions are requested **contextually on first Start tap**, never as a cold wall. ([Apple HIG — Launching](https://developer.apple.com/design/human-interface-guidelines/launching), [Apple HIG — Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [NN/g — Get Started Stops Users](https://www.nngroup.com/articles/get-started/))

**Questions:**

1. The Home CTA is "Start Run." But if a runner taps it before granting Apple Music + Motion permissions, do they land in the Selector (config first, permission later) or hit the permission prompt immediately? Each choice trades first-tap success against a jarring interrupt — which one are you optimizing for, and why?
2. Does tapping "Start Run" skip the Selector entirely (using last-used vibe + pace) and go straight to Active, or always route through the Selector? If it skips, how does a new user with no last-session ever set a vibe — and if it never skips, haven't you just made the Selector a mandatory gate the research warns against?
3. "Resume — Sunset 7:00 pace" as the secondary action: what counts as a resumable session — a paused run from 2 minutes ago, or the *config* of yesterday's run? Pick one; the other has to live somewhere. Where does the loser go?
4. NN/g says skip onboarding when possible, but cadence-matching is genuinely unfamiliar. Where does the one-line explanation of "music matches your steps" live — a caption under the Home button, the first Selector screen, or the first Active screen — and what's the cost of the runner never reading it?
5. The research says hide settings, stats, history, and account behind a tab or profile. Does this app even have a tab bar, or is it a single-flow stack? If there's a tab bar, what are the 2–3 tabs, and does its presence undercut the "one giant Start button" focus of Home?
6. If you defer the Apple Music permission to first Start, and the runner *denies* it mid-flow, what does the Active screen become — a step counter with no music? Is a degraded "no music" mode in scope for v1, or is denial a dead end?

---

## 2. The Active screen: numbers, progress, and lock

**Decision at stake:** Which live numbers are hero vs. demoted, what progress UI to use (and only when there's a goal), and how the lock behaves. The failure mode is a 23-metric dashboard where nothing reads at a glance.

**Starting recommendation:** A three-tier hierarchy — **hero** is current cadence **SPM** (64–80pt, largest element on screen, the differentiator), **secondary trio** is time · distance · pace (NRC's proven set, ~28–32pt), everything else (calories, HR, total steps, song metadata) **demoted** to a swipe page or muted bottom row. Progress UI matches session type: radial ring around the hero **only when there's a goal**; a target-band gauge always; a slim song-progress bar for open free runs. **No user-customizable metric slots in v1.** Lock hides *controls*, never *data*; unlock is press-and-hold, not tap. ([Strava redesigned Record](https://press.strava.com/articles/strava-launches-redesigned-record-experience), [NN/g — Minimize Cognitive Load](https://www.nngroup.com/articles/minimize-cognitive-load/), [Peloton target metrics](https://www.pelobuddy.com/app-target-metrics/), [Nike — NRC run features](https://www.nike.com/help/a/nrc-run-features))

**Questions:**

1. SPM is the hero because it's the differentiator — but a runner mostly *feels* their cadence and cares about pace/distance. Are you sure SPM earns the single biggest number, or are you foregrounding the thing the app cares about over the thing the *runner* cares about? What evidence would change your mind?
2. The ring needs a goal to fill toward, but the target-band gauge (am I in the music's zone?) is always-on. If both wrap the hero number, do they visually collide? Pick the one that owns the space around the SPM number — and justify demoting the other to a different region.
3. Strava has 20k+ upvotes begging for customizable metrics and still ships a fixed layout. You're proposing the same restraint. What's your actual answer to the power user who wants HR on the main screen — "swipe to page 2," or "no"? If "swipe," does a sweaty thumb mid-run reliably find page 2?
4. Lock "hides controls, keeps data live." But if controls are hidden, how does the runner know they're locked vs. the app having frozen? What's the persistent visual proof of the locked state, and does it cost glanceability on the hero number?
5. Unlock via press-and-hold prevents accidents — but a runner with gloves or a rain-soaked screen may fail the hold. What's the failure tolerance: how long is the hold, and what happens on a failed attempt (nothing? a hint?)? You're trading accident-proofing against unlock reliability — where's the line?
6. For an open free run with no goal, you drop the ring for a song-progress bar. Does that mean the *same* Active screen has three different progress treatments depending on session type? Is that consistency cost worth the honesty of "no fake goal," or should one treatment cover all cases?
7. Tabular figures are mandated so digits don't jitter. The clock updates every second for 40+ minutes — confirm: does *anything* animate on the once-per-second tick, or is the clock a hard "instant update, zero motion"? If SPM rolls but the clock doesn't, is that inconsistency legible or just odd?

---

## 3. Manual-pace affordance

**Decision at stake:** How a runner overrides the auto-matched tempo without cluttering the Active screen or losing sight that a session is live. The failure mode is inlining a slider that competes with the hero number.

**Starting recommendation:** A collapsed **"tempo chip"** anchored lower-right (current target SPM + metronome glyph, `surface #2e1a0e` fill, `border #4a2e18` hairline). Tap or drag-in to slide up a **bottom sheet** (not a nav push) containing: a horizontal SPM stepper/slider with live re-matching, a **"match my current pace" auto button**, and the now-playing transport. Auto is the default; manual is one tap away. This keeps the Active screen at ~two interactive elements (tempo chip + lock/end). ([Spotify fullscreen artwork](https://community.spotify.com/t5/iOS-iPhone-iPad/New-fullscreen-artwork-on-iOS/td-p/1741344), Apple Music now-playing minimalism)

**Questions:**

1. Auto-match ("music follows my feet") is the magic; manual is the escape hatch. But if auto is too aggressive — re-matching songs every time pace wobbles — the runner fights it. What's the hysteresis: how far off-target, for how long, before the song actually changes? You're trading responsiveness against whiplash.
2. The "match my current pace" button sets tempo *from* the runner's steps; the slider sets it manually. Once a runner taps "match my pace," are they now in auto or manual mode? If those two controls put the app in contradictory states, which wins, and is that obvious in the chip?
3. The chip lives lower-right — the same thumb arc you want for End/Stop. Do the tempo chip and the end-control crowd each other in the thumb zone? If you split them (chip right, end left), is the *destructive* control now on the dominant-thumb side where accidents happen?
4. Adjusting SPM re-matches the queue live. If a runner nudges from 165→170, does the *current* song jump immediately (jarring), or does only the *next* track honor the change? One respects the moment, one feels responsive — which, and what's the cost?
5. The sheet holds the slider, the auto button, *and* the transport. That's three concerns in one surface. Is the transport (skip/play/pause) actually a tempo concern, or are you bundling now-playing controls into the pace sheet just because both are "secondary"? Should transport live elsewhere?
6. The chip shows target SPM at rest. During the seconds the runner is dragging the slider, the Active hero still shows *live* SPM. Are two SPM numbers (target in sheet, live in hero) on screen at once confusing? How do you label them so the runner doesn't misread one for the other?

---

## 4. End-session UX

**Decision at stake:** How a run ends without accidental termination, and what the post-run summary shows. The failure mode is NRC's well-documented accidental-pause/stop problem — a brushed thumb loses the run and the trust.

**Starting recommendation:** **Slide-to-end** ("▸ slide to finish" track at the bottom of the unlocked screen) — the gesture *is* the confirmation, so no separate "are you sure?" modal. Hold-to-pause and slide-to-end made physically distinct so neither triggers the other. On-brand treatment, not literal red: track `accentDim`, thumb `accent`, label `text`. Summary is **music-native**: hero = avg cadence + distance/time/pace, then a **cadence-over-time chart annotated with the songs that played each segment**, splits list with dominant SPM + track per split, map below, **auto-saved** so a missed tap never loses the run. ([UX Movement — destructive actions](https://uxmovement.com/buttons/how-to-design-destructive-actions-that-prevent-data-loss/), [Strava — Run Activity Pages](https://support.strava.com/hc/en-us/articles/216919567-Run-Activity-Pages), [RevenueCat slide-to-unlock](https://github.com/RevenueCat/slide-to-unlock))

**Questions:**

1. Slide-to-end removes the confirm modal because "the gesture is the confirmation." But a long slide is annoying at the *end* of a hard run when the runner just wants to stop. How long is the slide track, and are you sure the accident-prevention is worth the friction on every single legitimate end? What's the abort rate you'd tolerate?
2. Pause is hold, end is slide — both gestures, both at the bottom. Can a runner reliably distinguish "hold here" from "slide here" while bouncing? If a runner *intends* pause but their thumb slides, do they accidentally end the run — the exact failure you're preventing?
3. The summary leads with avg cadence, but every competitor leads with distance/pace and that's what runners screenshot to share. Are you burying the shareable stat to make a point about your differentiator? Which number is actually the hero of the *summary*, and is it the same as the hero of the *active screen*?
4. The cadence-over-time chart annotated with songs is the differentiated, shareable moment — but it depends on per-segment song data being captured cleanly. If a run had only 2 songs over 40 minutes (long tracks), is the annotated chart still interesting, or does it fall flat? What's the minimum song-density for this to land?
5. Auto-save means no save button. How does a runner *delete* a junk run (accidental 30-second start)? If deletion requires its own destructive flow, have you just moved the "are you sure?" problem from end-of-run to the history screen?
6. Reduce-friction says auto-save and one Share action. But Apple Music coupling means the "songs that played" data is core to the share card. If the share card embeds Apple Music track names/art, are you within the Apple Music Identity Guidelines (see §7), or does the shareable moment create a legal exposure?

---

## 5. Motion & animation taste

**Decision at stake:** Where to spend the animation budget and where to show restraint. The failure mode is over-animating frequent interactions (Apple HIG's most-violated rule) and making the app feel cheap, or dropping frames on a 45-minute screen-on run.

**Starting recommendation:** Spend the taste budget on **exactly two moments** — (1) the origin-aware, haptic-paired **Start → Active** transition (scale/expand from the button's position, not screen center), and (2) the **cadence-lock celebration** (`.bouncy` spring pop + single success haptic + accent easing in). Everywhere else: restraint. `.snappy` for control press (scale to 0.96, ≤200ms), `.smooth` for ambient/data, `ease-out` for all entrances, `transform`/`opacity` only. The cadence ring breathes on a slow scale synced to *target*. Live numbers crossfade/roll on *change* (~150ms), never on tick. Reduce Motion fully wired — swap movement for opacity (vestibular safety for a moving user). ([Emil — Great Animations](https://emilkowal.ski/ui/great-animations), [Emil — 7 Practical Tips](https://emilkowal.ski/ui/7-practical-animation-tips), [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Material Duration & Easing](https://m1.material.io/motion/duration-easing.html))

**Questions:**

1. The cadence-lock celebration is the emotional payoff — but during a sustained run a runner locks, drifts, and re-locks repeatedly. If the bounce + haptic fires every time they re-enter the zone, it goes from delightful to maddening. Does it fire once per session, once per lock, or rate-limited? You're trading payoff against nag.
2. The breathing ring pulses synced to *target* cadence — but the whole point is the runner's *actual* steps. Should the pulse track target (a stable metronome to chase) or live cadence (honest but jittery)? One is a guide, one is a mirror; you can't have both in one pulse. Which, and why?
3. SPM rolls on change; the clock updates instantly. Over a run, SPM changes constantly — is the roll firing so often it violates "don't animate frequent interactions," the rule you're citing? At what change-rate does the roll become noise you should kill?
4. Reduce Motion is mandatory, but if you strip the cadence pulse, the ring goes static — and a static ring may read as "frozen/broken" to a moving runner. What replaces the pulse's *aliveness* under Reduce Motion without motion: an opacity breath, a color shift, nothing? Is "nothing" acceptable?
5. The Start→Active transition expands from the button's position. But if Apple Music/GPS spin-up takes 1–2 seconds, the transition either stalls (janky) or completes into an empty loading screen. Does the celebratory transition fit the *async reality* of starting a run, or are you animating into a spinner?
6. You're committing to spring physics (`.snappy`/`.smooth`/`.bouncy`). Springs are interruptible but harder to tune and profile than fixed curves. For a 45-min screen-on run, have you verified the ambient ring spring doesn't accumulate frame drops as the device warms? What's the profiling plan, and what's the fallback if springs jank?

---

## 6. Color direction & accent choice

**Decision at stake:** The single accent that replaces Spotify green — which hue, how many accents, and how the accent ties to app behavior. The failure mode is bolting a foreign color onto walnut (a saturated red/green reads as a "sticker") or going so safe the accent can't signal "locked."

**Starting recommendation:** One warm, desaturated accent inside walnut's "fire/sunset" family, used as the ~10% in a 60-30-10 scheme (walnut surfaces = 60/30, accent = live cadence, Start CTA, active selection, progress fill). Lead candidate: **Ember Coral `#F0764B`** (split-complementary warmth, reads as motion/exertion, 6.63:1 on `#1a0f08`). Optional secondary **Brass Gold `#D4A24E`** for achievement/streak moments. **Drive accent saturation off cadence-match state** — full Ember when locked, desaturating toward muted `#8a7060` when drifting, so the color *is* the feedback loop. Primary CTA = accent fill + dark walnut `#1a0f08` text (verified 6.63:1), **never cream on accent**. ([60-30-10](https://www.sixtythirtyten.co/blog/choose-color-palette-60-30-10-rule), [atmos.style dark mode](https://atmos.style/blog/dark-mode-ui-best-practices), [NV Gallery walnut pairings](https://www.nvgallery.com/en/blogs/magazine/walnut-wood-the-ideal-color-combinations-and-palettes-to-highlight-it/), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/))

Contrast (computed exactly against George hexes):

| Accent | vs bg `#1a0f08` | vs surface `#2e1a0e` | dark text on fill |
|---|---|---|---|
| Ember Coral `#F0764B` | 6.63 | 5.82 | 6.63 |
| Brass Gold `#D4A24E` | 8.14 | 7.15 | 8.14 |
| Verdigris Teal `#2DB7A3` | 7.54 | 6.62 | 7.54 |
| Warm Amber `#F5A623` | 9.29 | 8.16 | 9.29 |

**Questions:**

1. Ember Coral is the energy lead; Brass Gold is the "expensive" lead but it's *close to George's existing `#c8b89a`* — so app #3 risks looking like a recolor of #1/#2. Which matters more: maximum energy (coral) or maximum premium-feel (gold), and is the cost of gold's low differentiation acceptable for a *third* sibling app?
2. Verdigris Teal is the boldest brand differentiator (true complement to walnut) but it's *cool* — fighting the high-energy running brief and flirting with the Spotify-green you're killing. Is brand distinctiveness worth contradicting the app's core mood, or does teal reintroduce the exact problem you're solving?
3. "Drive accent saturation off match-state" is elegant but means the accent is *rarely* at full strength (only when locked). Does that undersell the accent's role as the Start CTA and primary brand color, which need to look right *at rest*? Can one token be both a stable brand color and a dynamic state signal?
4. You're proposing a two-warm system (coral + gold). Two accents strains 60-30-10. Is gold genuinely a *second accent*, or is it just a richer neutral for achievements? If a screen ever shows both coral and gold active, which one wins the eye, and have you actually got a screen where both appear?
5. The accent must carry the big SPM hero numerals for glanceability in sunlight. Coral is 6.63:1 on bg — passes AA — but is "passes AA" enough for a *sweaty thumb in direct sun*? Should the hero number use cream `#e8ddd0` (14:1) and reserve coral for the *ring/state*, rather than coloring the number itself?
6. Apple Music's brand is red/pink and you'll display its badge. A coral hero accent sits visually adjacent to Apple Music's red. Does Ember Coral on your screens risk reading as "Apple's color," creating both brand-confusion *and* the trade-dress concern from §7? Does that push you toward gold or teal to create distance?

---

## 7. Apple Music color & legal

**Decision at stake:** How close the accent can sit to Apple Music's red/pink, and exactly where Apple's official assets must (and must not) appear. The failure mode is cloning Apple's whole look (trade-dress confusion) or building your own "Apple Music" pill instead of using the unaltered badge — the actual contractual violation.

**Starting recommendation:** Use a warm ember/terracotta accent that *nods* at Apple Music's red energy but is unmistakably yours (`~#D6553C`–`#F0764B`), keeping George's walnut/cream trade dress as the legal shield. **Never** recolor the Apple Music note, build a custom "Apple Music" button, or clone their gradient+iconography+layout together. Use the **official unaltered "Listen on Apple Music" badge** wherever you surface Apple Music provenance. Factual nominative copy is fine ("Works with your Apple Music library"). Reserve Apple's actual red/pink for *inside* Apple's own asset. ([Apple Music Identity Guidelines](https://marketing.services.apple/apple-music-identity-guidelines), [Apple — Guidelines for 3rd Parties](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html), [Qualitex v. Jacobson](https://www.law.cornell.edu/supremecourt/text/514/159), [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/))

**Questions:**

1. Color isn't copyrightable and Apple can't trademark "red in a music app" — but trade-dress confusion comes from the *total look*. Given you're deeply coupled to Apple Music (real catalog, MusicKit playback), are you *more* exposed than a generic app, because a confused user could plausibly think Apple built this? How much visual distance from Apple's look is "enough," concretely?
2. The official badge is white/light and high-chroma — it will look like a "foreign sticker" on your warm dark walnut field. Do you accept the unaltered badge clashing with your palette (legally safe, visually jarring), or do you minimize where the badge appears to one screen? You can't restyle it — so where does it go?
3. The §4 summary share-card embeds Apple Music track names and possibly artwork. Is displaying catalog metadata/art on a *user-shareable* card still nominative fair use, or does putting it on a marketing-like artifact cross into "implying association"? Where's the line between in-app display and shareable promotion?
4. Your ember accent deliberately nods at Apple's red energy. Is "nods at their red" a feature (feels native, on-theme for music) or a liability (closer to confusion)? Argue the case for *maximizing* distance (gold/teal) vs. *minimizing* it (coral) on legal grounds, not just aesthetic ones.
5. If a runner has Apple Music but the track isn't in the catalog, or playback fails, what does the UI say — and does any error/empty state accidentally use Apple's marks or imply Apple is responsible for the failure? Have you audited the *unhappy paths* for badge/mark misuse, not just the happy path?
6. App Store marketing copy must focus on *your* app, not Apple's features. Your entire pitch is "matches Apple Music to your cadence" — Apple Music *is* the feature. How do you write the App Store description so it reads as Cadence's capability, not "an Apple Music feature," without burying what the app actually does?

---

## Exit criteria for the grill sessions

A section is **done** when, for its decision, you can state in one sentence: *what you chose, what you gave up, and the one piece of evidence (research citation, contrast number, or HIG rule) that backs it.* If you can't name the trade-off, you haven't decided — you've deferred.
