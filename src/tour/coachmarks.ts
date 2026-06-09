import { CoachmarkId } from '@/tour/tourState';

// Copy for each feature-tour coachmark. Honesty firewall applies (no unverifiable
// state claims, no em dashes). onTheBeat only fires on a real detected on-beat
// moment (see active.tsx trigger), so its claim is always true when shown.
export const COACHMARK_COPY: Record<CoachmarkId, string> = {
  onTheBeat:
    "You're on the beat. Your steps are landing right on the rhythm, and the ring glows when you're locked in.",
  paceShift: 'Speed up or slow down and the music follows your new pace.',
  paceLock:
    'Tap to lock your pace. Handy on a treadmill, or when you want the music to hold steady.',
  holdToEnd: 'Press and hold to end your session.',
};
