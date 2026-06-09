// Cadence visual system — Onyx base + Marigold energy accent.
// Single source of truth for color. See docs/adr/0003-visual-system.md.
//
// George (the warm walnut house palette) survives only as a hint: the cream
// `text` and the warm `accent`. The base is neutral Onyx, not brown — Cadence is
// app #3 and reads athletic, not coffee-shop.

export const colors = {
  // Base — neutral near-black, not brown.
  background: '#0c0c0d', // Onyx
  surface: '#18181b', // Slate — cards, sheets
  surfaceHigh: '#202024', // Slate elevated
  border: '#2a2a2e', // Graphite — dividers, ring track, outlines

  // Text — cream is the George identity hint.
  text: '#ece4d6', // Bed Light — primary
  muted: '#8c867e', // Ash — secondary labels, "finding your pace" / notices
  faint: '#6a655f', // tertiary / quiet chrome
  disabled: '#4a4640', // placeholders, inactive numerals

  // Accent — energy + the "in the pocket" signal (see ADR 0002).
  accent: '#EFA836', // Cadence Gold (Marigold)
  accentDim: '#2a2114', // Ember Coal — pressed/disabled accent, dim fills
  accentSoft: 'rgba(239, 168, 54, 0.13)', // translucent accent — chip/badge backgrounds
  onAccent: '#0c0c0d', // text/icon on an accent fill (Onyx)

  // Status
  danger: '#e5544a', // errors
  scrim: 'rgba(8, 8, 10, 0.72)', // modal backdrops
} as const;

export type Colors = typeof colors;
