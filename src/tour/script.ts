// The feature tour is a SCRIPTED, Dabble-style guided walkthrough: a fixed
// sequence of spotlight steps across home -> vibe setup -> the session screen.
// It runs when pending (first launch after onboarding, or Replay tour) and the
// user is locked into the sequence only loosely: every step shows Skip.
//
// Copy rules: honesty firewall (no unverifiable state claims), no em dashes.

export type TourScreen = 'home' | 'setup' | 'active';

// Spotlight targets, one ref per target on its screen.
export type TourTarget = 'start' | 'vibes' | 'go' | 'hero' | 'lock' | 'song' | 'hold';

export interface TourStep {
  id: string;
  screen: TourScreen;
  target: TourTarget;
  copy: string;
  // 'action' = advances when the user performs the real action (tap Start /
  // Let's go). 'tap' = advances on the card's Got it button.
  advance: 'action' | 'tap';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home-start',
    screen: 'home',
    target: 'start',
    copy: 'Every run starts here. Tap Start when you are ready.',
    advance: 'action',
  },
  {
    id: 'setup-vibes',
    screen: 'setup',
    target: 'vibes',
    copy: "Pick a vibe. We'll find songs in that lane whose tempo fits your stride.",
    advance: 'tap',
  },
  {
    id: 'setup-go',
    screen: 'setup',
    target: 'go',
    copy: "Tap Let's go to start a session.",
    advance: 'action',
  },
  {
    id: 'active-hero',
    screen: 'active',
    target: 'hero',
    copy: 'Your live cadence, in steps per minute. The ring glows gold when your steps land on the beat.',
    advance: 'tap',
  },
  {
    id: 'active-song',
    screen: 'active',
    target: 'song',
    copy: 'Songs queue at your tempo. Speed up or slow down and the music follows.',
    advance: 'tap',
  },
  {
    id: 'active-lock',
    screen: 'active',
    target: 'lock',
    copy: 'Tap the lock to hold your pace. Handy on a treadmill, or when you want the music to stay put.',
    advance: 'tap',
  },
  {
    id: 'active-hold',
    screen: 'active',
    target: 'hold',
    copy: "Press and hold to end a session. That's the tour!",
    advance: 'tap',
  },
];

export const TOUR_STEP_COUNT = TOUR_STEPS.length;

export function stepAt(index: number): TourStep | null {
  return index >= 0 && index < TOUR_STEPS.length ? TOUR_STEPS[index] : null;
}
