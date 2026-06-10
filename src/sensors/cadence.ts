import { Pedometer } from 'expo-sensors';
import { CADENCE_WINDOW_MS, CADENCE_MIN_DATA_SEC, CADENCE_TICK_MS } from '@/types';

type CadenceCallback = (stepsPerMinute: number) => void;

// Whether the app can read steps. Drives the no-motion state (see CONTEXT.md).
//
// Deliberately biased toward "yes": on iOS, CMPedometer's authorization is
// unreliable through getPermissionsAsync (it commonly reports `undetermined` or a
// misleading `granted: false` even when steps read fine), so we only treat motion
// as unavailable on a DEFINITE negative — no pedometer hardware, or an explicit
// `denied`. Anything else (granted, undetermined, or a throwing/flaky API) is
// treated as usable, so we never wrongly block a working session. An undetermined
// permission resolves itself: the first step subscription triggers the OS prompt.
export async function canReadMotion(): Promise<boolean> {
  try {
    if (!(await Pedometer.isAvailableAsync())) return false;
    // Probe ACTUAL readability. getPermissionsAsync is unreliable for CMPedometer
    // (it returns status:'denied' even when Motion & Fitness is enabled in
    // Settings). getStepCountAsync exercises the real permission: it resolves when
    // motion is readable and throws when genuinely denied (same signal
    // seedFromHistory already relies on).
    const end = new Date();
    const start = new Date(end.getTime() - 1000);
    try {
      await Pedometer.getStepCountAsync(start, end);
      return true;
    } catch {
      return false;
    }
  } catch {
    return true;
  }
}

export interface StepSample {
  t: number; // Date.now()
  steps: number; // cumulative steps since subscription start
}

// Perceived cadence = steps in the last window / elapsed * 60.
//
// `steps` from CMPedometer is cumulative since subscription, so we take the
// delta between the newest sample and the oldest one still inside the window —
// the cumulative offset cancels out. Using `now` (not the newest sample time)
// for the span means the value decays toward 0 when steps stop arriving.
// Returns null while there isn't yet `minDataSec` of data.
export function perceivedCadence(
  samples: StepSample[],
  now: number,
  windowMs: number = CADENCE_WINDOW_MS,
  minDataSec: number = CADENCE_MIN_DATA_SEC
): number | null {
  if (samples.length === 0) return null;

  const cutoff = now - windowMs;
  let start = 0;
  while (start < samples.length - 1 && samples[start + 1].t <= cutoff) start++;

  const oldest = samples[start];
  const newest = samples[samples.length - 1];
  const spanSec = (now - oldest.t) / 1000;
  if (spanSec < minDataSec) return null;

  const steps = newest.steps - oldest.steps;
  return Math.round((steps / spanSec) * 60);
}

export class CadenceDetector {
  private _subscription: { remove: () => void } | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _buffer: StepSample[] = [];
  private _onCadence: CadenceCallback | null = null;
  // Step accounting that survives buffer clears and resume:
  // _stepsBase = steps carried over from before this subscription (resume seed);
  // _lastCumulative = latest cumulative-since-subscription sample, latched
  // outside the buffer so recalibrate() (which clears the buffer) can't lose it.
  private _stepsBase = 0;
  private _lastCumulative = 0;

  async isAvailable(): Promise<boolean> {
    return Pedometer.isAvailableAsync();
  }

  start(onCadence: CadenceCallback): void {
    // A second start() (double-tap, fast resume) must not stack a second
    // pedometer subscription + interval: that leaks AND doubles cadence events.
    this._subscription?.remove();
    if (this._timer) clearInterval(this._timer);

    this._onCadence = onCadence;
    this._buffer = [];
    this._lastCumulative = 0; // new subscription counts from zero

    this._subscription = Pedometer.watchStepCount(({ steps }) => {
      this._lastCumulative = steps;
      this._buffer.push({ t: Date.now(), steps });
    });

    // Recompute on a fixed tick — independent of pedometer event timing — so the
    // value stays live and decays to 0 when you stop.
    this._timer = setInterval(() => this._tick(), CADENCE_TICK_MS);
  }

  private _tick(): void {
    const now = Date.now();
    // Bound memory: drop samples fully outside the window, keep one anchor.
    const cutoff = now - CADENCE_WINDOW_MS;
    while (this._buffer.length > 1 && this._buffer[1].t <= cutoff) this._buffer.shift();

    const cadence = perceivedCadence(this._buffer, now);
    if (cadence !== null && this._onCadence) this._onCadence(cadence);
  }

  // Total session steps: the resume-carried base plus the latched cumulative
  // count from this subscription. Survives recalibrate()'s buffer clear.
  totalSteps(): number {
    return this._stepsBase + this._lastCumulative;
  }

  // Carry steps recorded before a kill/resume into this subscription's total.
  seedStepsBase(steps: number): void {
    this._stepsBase = steps;
  }

  recalibrate(): void {
    this._buffer = [];
  }

  // Emit one immediate cadence estimate from recent pedometer history so resume
  // doesn't show a calibrating gap. Does not touch the live buffer; the normal
  // watchStepCount ticks take over within the window.
  async seedFromHistory(windowMs: number = CADENCE_WINDOW_MS): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - windowMs);
    try {
      const { steps } = await Pedometer.getStepCountAsync(start, end);
      const spm = Math.round((steps / (windowMs / 1000)) * 60);
      if (spm > 0 && this._onCadence) this._onCadence(spm);
    } catch {
      // History unavailable on this device/permission — fine, live ticks fill in.
    }
  }

  stop(): void {
    this._subscription?.remove();
    this._subscription = null;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._buffer = [];
    this._onCadence = null;
    this._stepsBase = 0;
    this._lastCumulative = 0;
  }
}
