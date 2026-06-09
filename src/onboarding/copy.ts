// Onboarding framing copy. Gated by the honesty firewall (CONTEXT.md): the only
// performance number permitted is the graded ~10% lower perceived effort,
// attributed and hedged. No "+15% endurance" or any unhedged stat. No em dashes.
export const FRAMING = {
  payoff: {
    title: 'Music that makes the work feel easier.',
    body: "In studies, moving in time to music lowered runners' perceived effort by about 10%. Same pace, less effort. Cadence matches the beat to your stride.",
    cta: 'How it works',
  },
  mechanism: {
    title: "It's called entrainment.",
    body: 'Your nervous system naturally locks onto a steady beat. Cadence reads your pace and queues songs at your exact tempo. Speed up, and the music follows.',
    cta: 'Get started',
  },
} as const;

// Permission primers shown in onboarding.
//
// Motion is an *informational heads-up*, not an Allow button: iOS won't reliably
// let us re-prompt once motion is decided (canAskAgain:false) and the status API
// misreports, so we set expectations and let the OS prompt fire when the first
// session starts (denial is then handled by the in-app no-motion state).
export const PRIMERS = {
  motion: {
    title: 'Cadence reads your steps.',
    body: 'It measures your steps per minute to match music to your pace. It never tracks your location. Tap below and iOS will ask for Motion access.',
    cta: 'Allow motion access',
  },
  appleMusic: {
    title: 'Connect Apple Music.',
    body: 'Cadence finds songs in your library whose tempo matches your stride.',
    disclaimer: 'Playback needs an Apple Music subscription. Pace detection works without one.',
    cta: 'Connect Apple Music',
    continueWithout: 'Continue without Apple Music',
  },
} as const;

// Shown in the active screen's message slot during the first session's pre-music
// wait (calibration + track load) so a first-timer does not think it broke.
export const FIRST_RUN_REASSURANCE = 'Keep moving, finding songs that match your pace…';
