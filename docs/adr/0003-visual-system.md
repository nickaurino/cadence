# ADR 0003: Cadence visual system — Onyx base + Gold energy accent

Status: Accepted (2026-06-08)

Supersedes the brown-base direction explored in `docs/design-research/` (the full
George walnut background). George survives as a *warm identity hint* (cream text,
a warm accent), not as the whole environment.

## Context

The George Theme (warm dark walnut/cream) is the house palette across Nick's first
two apps. For Cadence (app #3) the brief was to use George as a *layer*, not the
room, and to make the app feel like movement/energy — "not a brown coffee app."

Mockups (`docs/design-research/theme-systems.html`, then `neutral-themes.html`)
compared full systems. The brown-background themes were rejected: the
brown+accent pairing read coffee-shop, not athletic. A 2×2 of neutral bases (Onyx
vs Silver) × accents (Coral vs Gold) was rendered; **Onyx + Gold** was chosen — it
keeps the warm "weight" of gold and a cream hint of George while dropping the brown.

## Decision

Cadence's visual system (dark, default):

| Role        | Hex       | Name        | Notes |
|-------------|-----------|-------------|-------|
| background  | `#0c0c0d` | Onyx        | Near-black neutral base. Not brown. |
| surface     | `#18181b` | Slate       | Cards, sheets. |
| border      | `#2a2a2e` | Graphite    | Dividers, ring track. |
| text        | `#ece4d6` | Bed Light   | George cream — the warm identity hint. |
| muted       | `#8c867e` | Ash         | Secondary labels, inactive. |
| accent      | `#EFA836` | Cadence Gold (Marigold) | The energy + in-the-pocket signal: hero ring, CTA, lock state. Saturated marigold for motion, not a muted brass. |
| accentDim   | `#2a2114` | Ember Coal  | Pressed/disabled accent within the base. |

Accent usage follows ADR 0002 and CONTEXT.md: gold is the **in-the-pocket** signal
— full Cadence Gold (`#EFA836`) on the hero ring when locked, desaturated toward
Ash while shifting pace. CTA is a solid gold fill with Onyx (`#0c0c0d`) text.

Contrast (computed, vs `#0c0c0d`): accent ≈ 9.6:1, text ≈ 14:1, Onyx-on-gold CTA
label ≈ 9.6:1 — all clear AA. (Marigold `#EFA836` was chosen over the softer
`#E6B24C` for more motion/energy; alternatives recorded in
`docs/design-research/gold-refine.html`.)

A **light theme** (Silver base, option C) is deferred but the system is built as
tokens so it can drop in later (see ADR 0002's reversibility note).

## Consequences

- Implementation: introduce a single token source (theme object) and route every
  screen's colors through it, replacing the current ad-hoc darks and the Spotify
  green `#1DB954`. Must preserve existing layout/routing — colors only.
- The accent is gold, not coral. Coral remains on file as an alternative if gold
  reads too "achievement" vs "motion" once in the running app.
- George brown (`#1a0f08` etc.) is no longer Cadence's base; it stays the house
  palette for Nick's other apps. Cadence diverges deliberately so app #3 is
  visually its own thing.
