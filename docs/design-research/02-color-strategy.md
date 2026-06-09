# 02 — Color Strategy

> Evolving the **George Theme** (warm dark walnut/cream) into Cadence — app #3 — while replacing the borrowed Spotify-ish green, locking in a premium accent, and staying legally clean against Apple Music.

**Cadence** is a running/walking app that matches Apple Music songs to your step cadence. Color here is not decoration — the accent is the *"you're in the pocket, your steps match the beat"* signal. That single fact drives every recommendation below toward a **warm, high-energy accent** rather than a calming one.

---

## 0. The decision in one paragraph

Keep the George walnut/cream world as the calm **60-30-10 base** and replace the Spotify green `#1DB954` with **one** warm, desaturated, fire-family accent that George never reaches elsewhere. Lead recommendation: **Ember Coral `#F0764B`** for all live/active states, with **Brass Gold `#D4A24E`** as an optional secondary for achievement moments. This keeps the lineage recognizably "Nick," makes app #3 visibly distinct from apps #1–2, ties the accent to the app's core mechanic, and passes WCAG AA on every George surface. On Apple Music: borrowing a warm red/coral *hue* is low-risk; cloning Apple's logos, badges, or whole look is the actual hazard — so evolve George, don't paste Apple's red.

---

## Part A — Color-Theory Principles

### A1. Harmony: why the green fails and where the accent belongs

George's current accent (`#c8b89a` Bed Medium) is **analogous** — the same brown family as everything else. That reads calm but inert, with no "pop" for a CTA. The foreign green `#1DB954` looks bolted-on because it sits at a *saturation and hue* George never earns elsewhere: a cool intruder in a warm-wood world (the opposite of calm).

The classic harmony models map onto the decision like this ([Supercharge](https://supercharge.design/blog/color-harmonies-in-ui-in-depth-guide), [NN/g](https://www.nngroup.com/articles/color-enhance-design/), [IxDF](https://ixdf.org/literature/topics/color-harmony)):

| Harmony | Relationship to walnut | Verdict for Cadence |
|---|---|---|
| **Analogous** (George today) | Same brown family | Great for the *base*, too quiet for the cadence signal |
| **Complementary** | Walnut's orange (~25–35°) ↔ blue/teal (~205–215°) | Highest energy; the "turquoise + dark brown" furniture pairing ([NV Gallery](https://www.nvgallery.com/en/blogs/magazine/walnut-wood-the-ideal-color-combinations-and-palettes-to-highlight-it/)) → Teal direction |
| **Split-complementary / warm-arc jump** | Push *within* the fire family (coral, amber, copper) but spike the saturation | Safest "related-but-distinct" move → **Ember Coral / Brass Gold** |

**Principle:** Use a **single-accent** scheme, not a triad. Per the **60-30-10 rule** ([sixtythirtyten](https://www.sixtythirtyten.co/blog/choose-color-palette-60-30-10-rule)), the dominant (background) and secondary (surface) stay neutral browns, and the accent is reserved for the ~10%: the live cadence readout, the "Start Run" CTA, the BPM-match indicator, progress rings. Restraint is what reads as premium.

### A2. Warm dark palettes & dark-mode craft

George is already a textbook warm dark palette, and current guidance validates it ([atmos.style](https://atmos.style/blog/dark-mode-ui-best-practices), [Colorhero](https://colorhero.io/blog/dark-mode-color-palettes-2025), [Toptal](https://www.toptal.com/designers/ui/dark-ui-design)):

- **Never pure black.** `#1a0f08` is a warm near-black — it reduces the harsh halation pure black creates around light text.
- **Elevation via lighter, warmer surfaces, not shadows.** George's `#1a0f08` → `#2e1a0e` → `#4a2e18` is already a clean three-step elevation ramp. Keep it; don't add drop shadows.
- **Desaturate the accent.** This is the single most important green-replacement rule: saturated colors "vibrate" on dark backgrounds, strain eyes, and fail accessibility. Guidance is ~20 points lower saturation in dark mode. Every candidate below is deliberately pulled back from neon.
- **Warm accents reinforce the mood.** Warm charcoal + soft gold is explicitly cited as reading "expensive and exclusive" — the Brass Gold direction, tuned to George's hex.

For a running app used **outdoors in bright sun and at night**, a warm desaturated accent stays legible in glare better than a thin neon, and the dark base saves OLED battery on long runs — a real retention factor.

### A3. Comfort/retention: let the base be calm, the accent be energy

The psychology splits cleanly ([UXmatters](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php), [SevenSquare](https://www.sevensquaretech.com/color-psychology-influence-user-behavior-mobile-app-design/), [Glance](https://thisisglance.com/learning-centre/what-colours-psychology-should-i-use-in-my-app-design)):

- **Warm = dynamic/active.** Red/orange raise perceived energy; the fitness convention is "energizing reds, motivating oranges."
- **Cool = calm/soothing.** Blue/green lower arousal — right for meditation, *less* right for a momentum-driven cadence app.

Cadence wants **both, at different moments**. The cozy walnut world makes the app feel premium and unintimidating *before and after* the run (lowering the barrier to opening it); the warm accent fires *during* the run when the song locks to your cadence. That **comfort → energy arc** is what the wellness-UX literature ties to longer sessions and higher DAU.

**Actionable rule — tie accent intensity to match-state:** when steps and song BPM are locked, drive the accent to full Ember Coral and pulse the progress ring on the beat; when you drift off-cadence, desaturate toward `#8a7060` muted brown. The color *is* the feedback loop.

### A4. WCAG contrast — verified against the George palette

WCAG thresholds: **4.5:1** for normal text, **3:1** for large text and non-text UI components/icons ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Make Things Accessible](https://www.makethingsaccessible.com/guides/contrast-requirements-for-wcag-2-2-level-aa/)). The accent will be colored numerals, icons, ring strokes, and button fills — so it must clear 4.5:1 as text and 3:1 as a control. Ratios below are computed directly from the George hex values:

| Accent | vs bg `#1a0f08` | vs surface `#2e1a0e` | dark text `#1a0f08` on accent fill |
|---|---|---|---|
| **Ember Coral `#F0764B`** | **6.63** | 5.82 | 6.63 |
| **Brass Gold `#D4A24E`** | **8.14** | 7.15 | 8.14 |
| **Verdigris Teal `#2DB7A3`** | **7.54** | 6.62 | 7.54 |
| Warm Amber `#F5A623` (ref) | 9.29 | 8.16 | 9.29 |
| ~~Spotify green `#1DB954`~~ (old) | 7.28 | 6.39 | 7.28 |

George reference points: cream text `#e8ddd0` vs bg = **14.06** (excellent); muted `#8a7060` vs bg = **4.09** (passes large-text/non-text only — keep for secondary labels, not body); old accent `#c8b89a` vs bg = **9.66**.

**Key findings:**
- Every candidate passes AA for normal text on both background and surface (AAA in most cases).
- All three support **dark walnut text (`#1a0f08`) on a filled accent button** at 6.6–8.1:1 — so the primary CTA should be a **solid accent fill with dark walnut text**, the most premium button treatment.
- **Do not put cream text on the accent fills** (low contrast). Use dark walnut.
- For the big live SPM hero numerals (glanceability rule), Ember Coral on `#1a0f08` at 6.63:1 clears the bar comfortably.

---

## Part B — Proposed Evolved Palette

The George bones stay as the identity thread. The Spotify green is **deleted**. One warm accent family replaces it.

### B1. Core palette (inherited, unchanged)

| Role | Hex | Nickname | Rationale |
|---|---|---|---|
| Background | `#1a0f08` | George Undercoat | Warm near-black base (60%); the identity thread. Never pure black. |
| Surface | `#2e1a0e` | George Coat | Elevation step 1 — cards, sheets (30%). |
| Border | `#4a2e18` | Walnut Grain | Elevation step 2 — dividers, outlined buttons. |
| Text | `#e8ddd0` | Bed Light | Primary cream text; 14.06:1 on bg. |
| Muted | `#8a7060` | Bed Dark | Secondary labels, inactive/off-cadence state, tertiary buttons. |
| Subtle accent | `#c8b89a` | Bed Medium | Calm warm sand — primary text-on-surface, quiet chrome. Demoted from "active" role. |
| Accent dim | `#3d2a1a` | Dark Walnut | Pressed/disabled fill within the base family. |

### B2. New accent system (replaces `#1DB954`)

**Lead — Ember Coral.** Reserve it for *exactly one thing per screen*: the active/now state.

| Role | Hex | Nickname | Rationale |
|---|---|---|---|
| **Live accent** | `#F0764B` | **Ember Coral** | **Lead.** Split-complementary warm — same fire-family as walnut (rust/terracotta/copper are its most organic partners) but a saturation spike George never makes. Reads as motion, sunrise, exertion. 6.63:1 on bg. Use for Start-Run CTA fill (with `#1a0f08` text), live cadence numerals, on-beat ring. |
| **Live accent — dim** | `#7A3A22` | Ember Coal | Off-cadence / inactive / pressed state of the live accent. Desaturated coal that recedes when steps drift off-beat. |
| **Live accent — pulse** | `#FF8A5C` | Coral Flash | Brief on-beat / cadence-lock flash. The brightest the accent ever gets — appears only at full lock. |

### B3. Accent options (pick the lead; the others are alternates/secondary)

| Option | Hex | Nickname | Character | When to choose |
|---|---|---|---|---|
| **A — Ember Coral** *(lead)* | `#F0764B` | Ember Coral | High-energy, warm, "in the pocket" | Default. Best energy fit for a cadence/interval app; most clearly app #3. |
| **B — Brass Gold** *(secondary)* | `#D4A24E` | Brass Gold | Premium, calm, "expensive" | Pair *with* Coral for achievement/streak/PR moments and static chrome (gold = achievement, coral = live energy). Highest perceived premium but **least visually distinct** from `#c8b89a` — weaker as a sole accent. |
| **C — Verdigris Teal** *(wildcard)* | `#2DB7A3` | Verdigris Teal | Bold, calm, maximum differentiation | True complement to walnut; cleanest brand break from apps #1–2. But cool = calmer (fights the high-energy brief) and flirts with looking like the green you're replacing. Choose only if the app leans toward calm steady-state/walking. |

**Recommended ship config:** **Ember Coral as the single primary accent**, optionally **Brass Gold as a secondary** for achievement moments only — a tasteful two-warm system that still respects 60-30-10. Hold Teal in reserve.

### B4. Token sheet (mirror George's existing structure)

```
// Replace the old green token in ONE place; map it to accentLive.
accentLive      = #F0764B   // Ember Coral — CTA fill, live SPM, on-beat ring
accentDimLive   = #7A3A22   // Ember Coal — off-cadence / inactive / pressed
accentPulse     = #FF8A5C   // Coral Flash — cadence-lock flash only
accentPremium   = #D4A24E   // Brass Gold — optional, achievement/streak/PR
```

- Primary CTA = `accentLive` fill + `#1a0f08` (dark walnut) text — verified 6.63:1. **Not** cream text.
- Disabled "Start Run" (while GPS/audio spin up) = `accentDimLive` / `accentDim #3d2a1a` so the button visibly recedes.
- Drive accent saturation off cadence-match state (§A3) for the comfort→energy feedback loop.

---

## Part C — Borrowing Apple Music's Colors: The Verdict

**Practical verdict: You may use a red/coral/pink *hue* in your own distinct Cadence UI — it's low-risk. What you cannot do is reuse Apple's logos, badges, lockups, icons, or present color in a way that implies Apple built, endorses, or sponsors the app. Color alone is not the hazard; brand confusion is. And because Cadence is deeply tied to Apple Music (MusicKit, real catalog playback), lean *away* from cloning Apple's gradient — differentiate.**

### C1. Copyright — a non-issue

Copyright does not protect a color, a shade, or a hex value. It protects creative *expression* (a specific logo's artwork), not a hue or palette as an abstract idea. Lifting a hue or even a gradient *direction* is not copyright infringement.
- [Briffa — Can you copyright a colour?](https://www.briffa.com/blog/can-you-copyright-a-colour/): *"You cannot copyright a colour as such… or the idea of using a particular shade."*
- [TrademarkAngel — Can You Copyright a Color?](https://trademarkangel.com/trademark-color-alone/)

**→ Drop this worry entirely.**

### C2. Trademark / trade dress — the real (and narrow) lane

A single color *can* be a trademark, but only narrowly. Under **Qualitex Co. v. Jacobson Products Co., 514 U.S. 159 (1995)** ([Cornell LII](https://www.law.cornell.edu/supremecourt/text/514/159) · [Justia](https://supreme.justia.com/cases/federal/us/514/159/) · [Wikipedia](https://en.wikipedia.org/wiki/Qualitex_Co._v._Jacobson_Products_Co.)), a color qualifies only if it has acquired **secondary meaning** (consumers tie that color, on that product, to one source) **and is non-functional** — e.g. Tiffany blue, UPS brown, Louboutin red soles.

Two things make color marks weak, and both protect Cadence:
1. **Tied to a specific product category.** Apple does not (and essentially cannot) own "red/pink in a music-app UI" — red/pink are commonplace across music/media products, so the hue lacks distinctiveness as a *source identifier* the way Tiffany blue does.
2. **The infringement test is "likelihood of confusion,"** not "did you use a similar color." A similar accent in a visibly different app — your own name, icon, and overall look — does not create confusion.

The realistic risk is **trade dress** — the *total look and feel*. You'd only get into trouble by copying Apple Music's whole visual system (exact gradient + iconography + layout + type) so a user mistakes your screen for Apple's. A lone accent hue can't do that; a wholesale clone can. ([NYU JIPEL — Propertization of Color](https://jipel.law.nyu.edu/worries-about-the-propertization-of-color/))

**→ George's warm dark walnut/cream trade dress is nothing like Apple Music's white/light, high-chroma pink-red sheets. That existing distinctiveness is your best legal shield. Keep it.**

### C3. What Apple actually restricts (binding on you as a MusicKit developer)

Apple's guidelines are stricter than trademark law and you're contractually bound to them. The line is about **marks and endorsement, not hues**:
- [Apple — Guidelines for Using Apple Trademarks & Copyrights](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html): no use of Apple marks/logos in a manner implying "affiliation with or endorsement, sponsorship, or support."
- [Apple Music Identity Guidelines](https://marketing.services.apple/apple-music-identity-guidelines): use **only** the official, **unaltered** "Listen on Apple Music" lockups/badges — no shadows/glows, don't recolor the music-note icon, always spell out "Apple Music."
- [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/): copy should focus on *your* app, nothing "falsely suggest[ing] an association with Apple."

**→ The one rule that can actually bite:** where Cadence surfaces "this song is on Apple Music," use the **official unaltered badge** — don't build your own pink "Apple Music" pill, which is the easy violation to trip on when trying to look "native."

### C4. Apple Music's signature hues (approx.)

A vivid **red→pink gradient** on white/light surfaces (community-documented; Apple publishes no official hex sheet — treat as approximations):

| Hue | Hex |
|---|---|
| Classic Apple Music red | `#FA243C` / `#FC3C44` |
| Pink | `#FF2D55` / `#FF4E6B` |
| Deeper red | `#FF0436` |
| Icon gradient (≈) | `#FA2256 → #FB5C74` |

Sources: [Mobbin](https://mobbin.com/colors/brand/apple-music) · [BrandColorCode](https://www.brandcolorcode.com/apple-music) · [ColorsWall #fc3c44](https://colorswall.com/palette/61656).

### C5. Risky vs. safe — checklist

**Risky (avoid):**
- Reusing/recoloring the Apple Music note icon, badges, or lockups; building your own "Apple Music" button.
- Branding that implies Apple made/endorses Cadence (an Apple-logo-adjacent app icon, "Apple Music Cadence").
- Cloning Apple Music's *entire* look (exact gradient + iconography + now-playing layout) → trade-dress confusion.
- Apple product/UI screenshots in marketing that suggest association.

**Safe (fine):**
- A red/coral/pink *accent hue* in your own UI for your own controls.
- Factual compatibility statements: "Works with your Apple Music library," "Powered by Apple Music" (nominative use, kept factual and non-endorsing).
- The **official unaltered** "Listen on Apple Music" badge where appropriate.

### C6. Recommendation — don't match Apple's red

Don't match `#FA243C`. Legally, the closer your total look gets to Apple's the easier a confusion argument becomes — and you're already tightly coupled to their service. Design-wise, a saturated Apple red on `#1a0f08` looks like a foreign sticker, not a system. **Ember Coral `#F0764B` nods at Apple Music's red energy but is unmistakably Cadence's own** — warm, walnut-harmonized, and clearly distinct from Apple's hot pink-red. Let Apple's red live only inside Apple's own official badge; let Cadence's ember be Cadence's.

---

## Summary of recommendations

1. **Delete `#1DB954`.** It fights the palette, borrows a brand signal, and is too high-chroma as a fill.
2. **Adopt Ember Coral `#F0764B`** as the single live accent (dim `#7A3A22`, pulse `#FF8A5C`); optionally **Brass Gold `#D4A24E`** as a secondary for achievements.
3. **Keep the George bones** (`#1a0f08` / `#2e1a0e` / `#4a2e18` / `#e8ddd0` / `#8a7060` / `#c8b89a` / `#3d2a1a`) as the 60-30-10 calm base.
4. **CTA = accent fill + dark walnut `#1a0f08` text** (6.63:1), never cream-on-accent.
5. **Tie accent saturation to cadence-match state** — color as the feedback loop.
6. **On Apple Music:** borrow the warm-red *energy*, never the badge/logo/whole look. Use the official unaltered "Listen on Apple Music" badge; evolve George rather than paste Apple's red.
