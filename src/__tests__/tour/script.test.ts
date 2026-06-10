import { TOUR_STEPS, TOUR_STEP_COUNT, stepAt } from '@/tour/script';

describe('tour script', () => {
  it('walks home -> setup -> active in order, never backwards', () => {
    const order = ['home', 'setup', 'active'];
    let maxSeen = 0;
    for (const step of TOUR_STEPS) {
      const idx = order.indexOf(step.screen);
      expect(idx).toBeGreaterThanOrEqual(maxSeen);
      maxSeen = Math.max(maxSeen, idx);
    }
  });

  it('starts on the home Start button (action-gated) and ends on hold-to-end', () => {
    expect(TOUR_STEPS[0]).toMatchObject({ screen: 'home', target: 'start', advance: 'action' });
    expect(TOUR_STEPS[TOUR_STEPS.length - 1]).toMatchObject({ screen: 'active', target: 'hold' });
  });

  it('has unique ids and copy with no em dashes (copy style rule)', () => {
    const ids = new Set(TOUR_STEPS.map((s) => s.id));
    expect(ids.size).toBe(TOUR_STEP_COUNT);
    for (const step of TOUR_STEPS) {
      expect(step.copy.length).toBeGreaterThan(0);
      expect(step.copy).not.toContain('—');
    }
  });

  it('stepAt returns steps in range and null past the end', () => {
    expect(stepAt(0)).toBe(TOUR_STEPS[0]);
    expect(stepAt(TOUR_STEP_COUNT)).toBeNull();
    expect(stepAt(-1)).toBeNull();
  });
});
