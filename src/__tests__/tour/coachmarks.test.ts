import { COACHMARK_COPY } from '@/tour/coachmarks';
import { COACHMARK_IDS } from '@/tour/tourState';

describe('coachmark copy', () => {
  it('has copy for all four coachmarks', () => {
    for (const id of COACHMARK_IDS) {
      expect(typeof COACHMARK_COPY[id]).toBe('string');
      expect(COACHMARK_COPY[id].length).toBeGreaterThan(0);
    }
  });

  it('uses no em dashes (honesty firewall copy style)', () => {
    for (const id of COACHMARK_IDS) {
      expect(COACHMARK_COPY[id]).not.toContain('—');
    }
  });
});
