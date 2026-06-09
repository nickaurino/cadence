# Cadence — UI & Color Revamp: Research Brief

Date: 2026-06-08
Status: Backlog → research in progress (autonomous, auto-mode)

This captures the full design/UX/color research request so nothing is lost. The
research agents produce the deliverables listed at the bottom; those become the
inputs for grill-with-docs sessions when Nick is back.

## What Nick asked for

A full visual + interaction revamp of the Cadence app, grounded in research rather
than taste alone. Specifically:

### UX / UI patterns
- **Screen taxonomy:** what each screen is called in the industry — the "start"
  screen, the "selector" screen (vibe/pace picker), the "running"/active screen —
  and what makes each of those good.
- **CTA psychology:** what makes people *want* to hit the button. What's inviting
  without being noisy/cluttered. Restraint.
- **Animation:** tasteful micro-animations per screen; how slight motion makes an
  app feel polished and "expensive" without being distracting.
- **Make it feel expensive / premium / "a really good app."**

### Cadence-specific components
- **Manual pace** should be "off to the side, something you can enlarge" — i.e. a
  secondary affordance (side panel / expandable), not a primary focus.
- Which **numbers** need to be shown (and which to hide/demote) on the active screen.
- How **progress bars** should work.
- How the **lock** (pace lock) should work and be communicated.
- How **end session** should work.
- How all of these can carry **slight animations**.

### Color
- A **full color revamp**. Nick's signature palette ("George Theme" — warm dark
  walnut/brown + cream) has been used on his first two apps; he wants to **take a
  couple base colors and evolve it**, not reuse it verbatim (so app #3 looks
  distinct).
- The app works with **Apple Music** — consider borrowing from Apple Music's
  colors. **Open question: copyright/trademark** on using Apple Music's colors.
- **Color theory:** how colors work well together, how to use color to keep people
  comfortable and engaged (retention), what works well "in apps."
- Does the color system affect the UI decisions above? (Yes — research how.)

### Process
- Plan it out first; run grill-with-docs sessions per issue that warrants one.
- Establish a **ubiquitous language** (shared glossary) for the design work.

## George Theme palette (signature — evolve, don't copy)

| Role       | Hex       | Nickname         |
|------------|-----------|------------------|
| background | `#1a0f08` | George Undercoat |
| surface    | `#2e1a0e` | George Coat      |
| border     | `#4a2e18` | Walnut Grain     |
| text       | `#e8ddd0` | Bed Light        |
| muted      | `#8a7060` | Bed Dark         |
| accent     | `#c8b89a` | Bed Medium       |
| accentDim  | `#3d2a1a` | Dark Walnut      |

Warm, dark, walnut/cream. Current in-app accent is Spotify-ish green (`#1DB954`)
— to be replaced as part of the revamp.

## Deliverables (research agents produce these)

1. `01-screen-taxonomy-and-ux.md` — industry screen names (onboarding/start,
   selector/picker, active/now-playing), what makes each good, CTA psychology,
   visual restraint, micro-animation guidance, and concrete Cadence applications
   (manual-pace side panel, numbers to show, progress bars, lock, end session).
2. `02-color-strategy.md` — color theory & harmony, comfort/retention, an evolved
   palette proposal (hex + roles + rationale) derived from George, Apple Music
   color borrowing + a clear trademark/copyright answer.
3. `03-ubiquitous-language.md` — shared glossary of design + domain terms.
4. `04-grill-prep.md` — the sharp, specific questions per design issue to drive
   grill-with-docs sessions.

All claims in the color/legal sections should be web-sourced where possible and
cited; UX guidance should reference recognized sources (NN/g, Apple HIG, Material,
Refactoring UI, Karageorghis for exertion/music where relevant).
