import { CADENCE_FLOOR, CADENCE_CEILING } from '@/types';

// Helpers for the "Set pace" assist: nobody knows their steps-per-minute, but
// they know how hard they're running or how fast they're walking.
//
// Running cadence is near-constant across speed (turnover holds ~165-185 while
// stride length does the work), so runners pick an EFFORT, not a speed. Walking
// cadence, by contrast, rises roughly linearly with speed, so walkers can enter
// mph. See docs/ideas/session-controls-backlog.md for the research verdict.

export interface RunEffort {
  label: string;
  spm: number;
}

// Anchored to the wheel's existing key-pace labels (easy/typical/fast run).
export const RUN_EFFORTS: RunEffort[] = [
  { label: 'Easy', spm: 165 },
  { label: 'Typical', spm: 175 },
  { label: 'Fast', spm: 185 },
];

// Walking-only mph range. Past ~4.5 mph most people break into a run, where the
// linear relationship no longer holds.
export const WALK_MPH_MIN = 2.0;
export const WALK_MPH_MAX = 4.5;
export const WALK_MPH_STEP = 0.1;

// Walking cadence from treadmill speed: cadence ≈ 16 * mph + 60 (population fit,
// walking only — 3.0 mph ≈ 108 spm, 4.0 mph ≈ 124 spm). An estimate to get the
// user close, never presented as a measured personal cadence. Clamped to the
// human guard rails so a stray value can't lock a pace the detector treats as
// noise.
export function walkingCadenceFromMph(mph: number): number {
  const raw = Math.round(16 * mph + 60);
  return Math.min(CADENCE_CEILING, Math.max(CADENCE_FLOOR, raw));
}

// Round to one decimal so the mph stepper doesn't drift on repeated +/- (float).
export function clampWalkMph(mph: number): number {
  const bounded = Math.min(WALK_MPH_MAX, Math.max(WALK_MPH_MIN, mph));
  return Math.round(bounded * 10) / 10;
}
