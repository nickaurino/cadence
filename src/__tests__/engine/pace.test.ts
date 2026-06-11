import { walkingCadenceFromMph, clampWalkMph } from '@/engine/pace';
import { CADENCE_FLOOR, CADENCE_CEILING } from '@/types';

test('walking cadence follows 16*mph + 60', () => {
  expect(walkingCadenceFromMph(3.0)).toBe(108);
  expect(walkingCadenceFromMph(4.0)).toBe(124);
  expect(walkingCadenceFromMph(2.0)).toBe(92);
});

test('walking cadence clamps to the guard rails', () => {
  expect(walkingCadenceFromMph(-5)).toBe(CADENCE_FLOOR);
  expect(walkingCadenceFromMph(100)).toBe(CADENCE_CEILING);
});

test('clampWalkMph keeps mph in range and free of float drift', () => {
  expect(clampWalkMph(1.0)).toBe(2.0);
  expect(clampWalkMph(9.0)).toBe(4.5);
  expect(clampWalkMph(3.0 + 0.1)).toBe(3.1);
});
