// The feature tour is a SCRIPTED, Dabble-style guided walkthrough: a fixed
// sequence of spotlight steps across home -> vibe setup -> a SIMULATED session
// (canned state, no engine, no music). It runs when pending (first launch after
// onboarding, or Replay tour). During the tour everything except the spotlit
// target is blocked; every step shows Skip.
//
// Copy rules: honesty firewall (no unverifiable state claims), no em dashes.

export type TourScreen = 'home' | 'setup' | 'active';

// Spotlight targets, one ref per target on its screen.
export type TourTarget = 'start' | 'vibes' | 'go' | 'hero' | 'song' | 'pills' | 'lock' | 'hold';

export interface TourStep {
  id: string;
  screen: TourScreen;
  target: TourTarget;
  copy: string;
  // 'action' = advances when the user performs the real action (tap Start, tap
  // Let's go, hold to end). 'tap' = advances on the card's Got it button.
  advance: 'action' | 'tap';
  // Force the copy card above or below the target (default: auto by position).
  cardPosition?: 'above' | 'below';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home-start',
    screen: 'home',
    target: 'start',
    copy: 'Every run starts here. Tap Start when you are ready.',
    advance: 'action',
    cardPosition: 'below', // keep the title and subtitle visible above the ring
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
    id: 'active-pills',
    screen: 'active',
    target: 'pills',
    copy: 'Set pace lets you dial in a pace yourself, like on a treadmill. Recalibrate re-reads your steps from scratch, useful if the match feels off or you want to leave a set pace.',
    advance: 'tap',
  },
  {
    id: 'active-lock',
    screen: 'active',
    target: 'lock',
    copy: 'The lock holds your current pace so the music stays put until you unlock it.',
    advance: 'tap',
  },
  {
    id: 'active-hold',
    screen: 'active',
    target: 'hold',
    copy: 'Press and hold to end the session. Go ahead, try it.',
    advance: 'action',
  },
];

export const TOUR_STEP_COUNT = TOUR_STEPS.length;

export function stepAt(index: number): TourStep | null {
  return index >= 0 && index < TOUR_STEPS.length ? TOUR_STEPS[index] : null;
}
