import { Pedometer } from 'expo-sensors';
import { CADENCE_WINDOW_MS, CADENCE_MIN_DATA_SEC, CADENCE_TICK_MS } from '@/types';

type CadenceCallback = (stepsPerMinute: number) => void;

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

  async isAvailable(): Promise<boolean> {
    return Pedometer.isAvailableAsync();
  }

  start(onCadence: CadenceCallback): void {
    this._onCadence = onCadence;
    this._buffer = [];

    this._subscription = Pedometer.watchStepCount(({ steps }) => {
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

  // Cumulative steps since the session started (latest pedometer sample).
  totalSteps(): number {
    return this._buffer.length ? this._buffer[this._buffer.length - 1].steps : 0;
  }

  recalibrate(): void {
    this._buffer = [];
  }

  stop(): void {
    this._subscription?.remove();
    this._subscription = null;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._buffer = [];
    this._onCadence = null;
  }
}
