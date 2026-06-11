import { CadenceSmoother } from '@/engine/smoothing';

function pushAll(s: CadenceSmoother, values: number[]): number[] {
  return values.map((v) => s.push(v));
}

test('first reading passes straight through', () => {
  const s = new CadenceSmoother();
  expect(s.push(170)).toBe(170);
});

test('a steady stride shows one steady number despite raw wobble', () => {
  const s = new CadenceSmoother();
  // Raw windowed readings wobble +/-2 around 140 — the real-world complaint.
  const out = pushAll(s, [140, 142, 139, 141, 140, 138, 141, 140, 142, 139, 140, 141]);
  // After the first reading the display never leaves 140.
  expect(new Set(out.slice(1))).toEqual(new Set([140]));
});

test('a single spike reading never reaches the display', () => {
  const s = new CadenceSmoother();
  const out = pushAll(s, [140, 141, 139, 230, 140, 141, 140]);
  for (const v of out) expect(Math.abs(v - 140)).toBeLessThanOrEqual(1);
});

test('a real pace change glides to and settles on the new value', () => {
  const s = new CadenceSmoother();
  pushAll(s, [140, 140, 140, 140, 140]);
  const out = pushAll(s, Array(20).fill(160));
  // Moves monotonically up...
  for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThanOrEqual(out[i - 1]);
  // ...and converges exactly (the stable snap defeats the deadband's last 1 spm).
  expect(out[out.length - 1]).toBe(160);
});

test('seed jumps the filter immediately and glides from there', () => {
  const s = new CadenceSmoother();
  pushAll(s, [120, 120, 120]);
  s.seed(170);
  expect(s.push(170)).toBe(170);
});

test('reset clears history so the next reading passes through', () => {
  const s = new CadenceSmoother();
  pushAll(s, [120, 120, 120]);
  s.reset();
  expect(s.push(180)).toBe(180);
});
