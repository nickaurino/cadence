// Display smoothing for the perceived-cadence number (and the ring fed from it).
//
// The raw windowed spm wobbles +/-3-6 even at a metronomic stride: CMPedometer
// delivers steps in uneven batches, so 8s-window deltas jitter. The layered
// filter here is the standard running-watch treatment:
//   1. median of the last few readings  -> single-reading spikes never land
//   2. slow exponential glide           -> the value moves like a runner does
//   3. display deadband + stable snap   -> a steady stride shows ONE number
// The engine's management logic (guard rails, drift/sustain, re-matching) keeps
// using the RAW value; this exists purely so the number the user tries to
// "track the beat" with holds still.

const MEDIAN_WINDOW = 5;
const EMA_ALPHA = 0.25; // new reading's weight; ~4-5s to settle at 1 tick/s
const DISPLAY_DEADBAND = 2; // displayed value ignores moves smaller than this...
const STABLE_TICKS = 3; // ...unless the rounded value holds steady this long

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export class CadenceSmoother {
  private _recent: number[] = [];
  private _ema: number | null = null;
  private _displayed: number | null = null;
  private _stableRounded: number | null = null;
  private _stableCount = 0;

  // Feed one raw windowed reading; returns the value to display.
  push(spm: number): number {
    this._recent.push(spm);
    if (this._recent.length > MEDIAN_WINDOW) this._recent.shift();

    const med = median(this._recent);
    this._ema = this._ema === null ? med : this._ema * (1 - EMA_ALPHA) + med * EMA_ALPHA;
    const rounded = Math.round(this._ema);

    if (rounded === this._stableRounded) this._stableCount += 1;
    else {
      this._stableRounded = rounded;
      this._stableCount = 1;
    }

    // Deadband stops 1-spm flicker; the stable snap lets the display still
    // converge on the exact value (a pure deadband would park 1 spm off it).
    if (
      this._displayed === null ||
      Math.abs(rounded - this._displayed) >= DISPLAY_DEADBAND ||
      (rounded !== this._displayed && this._stableCount >= STABLE_TICKS)
    ) {
      this._displayed = rounded;
    }
    return this._displayed;
  }

  // Jump the filter to a known value (manual pace, resume seed): the next
  // readings glide FROM here instead of from stale history.
  seed(spm: number): void {
    this._recent = [spm];
    this._ema = spm;
    this._displayed = spm;
    this._stableRounded = spm;
    this._stableCount = 1;
  }

  reset(): void {
    this._recent = [];
    this._ema = null;
    this._displayed = null;
    this._stableRounded = null;
    this._stableCount = 0;
  }
}
