import {
  COACHMARK_IDS,
  allUnseen,
  allSeenMap,
  withSeen,
  shouldShow,
  allSeen,
} from '@/tour/tourState';

describe('tour state (independent one-time coachmarks)', () => {
  it('has the four coachmarks', () => {
    expect(COACHMARK_IDS).toEqual(['onTheBeat', 'paceShift', 'paceLock', 'holdToEnd']);
  });

  it('allUnseen is all false; allSeenMap is all true', () => {
    expect(Object.values(allUnseen())).toEqual([false, false, false, false]);
    expect(Object.values(allSeenMap())).toEqual([true, true, true, true]);
  });

  it('shouldShow is true only when the coachmark is unseen and none is showing', () => {
    const seen = allUnseen();
    expect(shouldShow(seen, null, 'onTheBeat')).toBe(true);
    expect(shouldShow(seen, 'paceShift', 'onTheBeat')).toBe(false); // another showing
    expect(shouldShow(withSeen(seen, 'onTheBeat'), null, 'onTheBeat')).toBe(false); // already seen
  });

  it('withSeen marks one without mutating the input', () => {
    const seen = allUnseen();
    const next = withSeen(seen, 'paceLock');
    expect(next.paceLock).toBe(true);
    expect(seen.paceLock).toBe(false); // original untouched
  });

  it('allSeen is true only when every coachmark is seen', () => {
    expect(allSeen(allUnseen())).toBe(false);
    expect(allSeen(allSeenMap())).toBe(true);
    let s = allUnseen();
    for (const id of COACHMARK_IDS) s = withSeen(s, id);
    expect(allSeen(s)).toBe(true);
  });
});
