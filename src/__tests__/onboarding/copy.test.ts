import { FRAMING, PRIMERS, FIRST_RUN_REASSURANCE } from '@/onboarding/copy';

// Honesty firewall (CONTEXT.md): graded claims only, no flattened stats, and no
// em dashes in user-facing copy. These tests guard onboarding copy against
// regressing to the old "+15% endurance" claim.
describe('onboarding framing copy', () => {
  const allStrings = [
    ...Object.values(FRAMING).flatMap((s) => [s.title, s.body, s.cta]),
    ...Object.values(PRIMERS).flatMap((s) => Object.values(s)),
    FIRST_RUN_REASSURANCE,
  ];

  it('keeps the graded ~10% perceived-effort claim, attributed', () => {
    expect(FRAMING.payoff.body).toMatch(/10%/);
    expect(FRAMING.payoff.body.toLowerCase()).toMatch(/studies|research/);
  });

  it('contains no banned overclaims (15% / endurance / "run longer")', () => {
    for (const s of allStrings) {
      expect(s).not.toMatch(/15\s*%/);
      expect(s.toLowerCase()).not.toContain('endurance');
      expect(s.toLowerCase()).not.toContain('run longer');
    }
  });

  it('uses no em dashes', () => {
    for (const s of allStrings) expect(s).not.toContain('—');
  });
});
