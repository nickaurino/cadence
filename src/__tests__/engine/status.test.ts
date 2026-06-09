import { sessionStatusLabel } from '@/engine/status';

describe('sessionStatusLabel', () => {
  const base = { isCalibrating: false, paceLocked: false, inThePocket: false };

  it('shows "Finding your pace" while calibrating (highest priority)', () => {
    expect(sessionStatusLabel({ ...base, isCalibrating: true, inThePocket: true })).toBe(
      'Finding your pace'
    );
  });

  it('shows "Pace locked" when manually locked', () => {
    expect(sessionStatusLabel({ ...base, paceLocked: true, inThePocket: true })).toBe(
      'Pace locked'
    );
  });

  it('shows "On the beat" when in the pocket (user-facing wording, not "In the pocket")', () => {
    expect(sessionStatusLabel({ ...base, inThePocket: true })).toBe('On the beat');
  });

  it('shows "Shifting" otherwise', () => {
    expect(sessionStatusLabel(base)).toBe('Shifting');
  });
});
