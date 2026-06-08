# Cadence

An iOS app that plays Apple Music matched to your running and walking cadence. It
reads your steps per minute from the pedometer and queues songs whose tempo lines up
with your stride, adapting in real time as you change pace.

## Highlights

- **Native MusicKit integration** via a custom [Expo Modules API](https://docs.expo.dev/modules/module-api/)
  module written in Swift: Apple Music authorization, catalog search, playback, and
  queue control.
- **On-device tempo detection.** Apple's catalog exposes no BPM, so the app downloads
  each song's 30-second preview and estimates tempo with spectral-flux onset detection
  and autocorrelation (Accelerate / vDSP). No third-party BPM API.
- **A real cadence engine.** A rolling-window *perceived cadence* plus a debounced
  *managed cadence* the music follows, with half/double-time matching, sensor guard
  rails, and user-tunable sensitivity. See
  [docs/adr/0001-cadence-measurement.md](docs/adr/0001-cadence-measurement.md).
- **57 unit tests** across the matching, BPM resolution, cadence, and session logic.

## Stack

React Native 0.85 · Expo SDK 56 · TypeScript (strict) · Swift (MusicKit, AVFoundation,
Accelerate) · Expo Router · Jest

## Architecture

```
src/sensors/   pedometer -> cadence (rolling window)
src/music/     Apple Music auth, BPM resolution, tempo matching, playback
src/engine/    session orchestration (perceived/managed cadence, queue, replenish)
modules/cadence-music-kit/   native Swift module (MusicKit + tempo analysis)
app/           Expo Router screens
docs/          CONTEXT.md glossary, ADRs, roadmap
```

UI imports from the engine only; the engine composes the sensor and music layers.

## Running

Requires Xcode, a paid Apple Developer account (with the MusicKit App Service enabled
on the App ID), and an Apple Music subscription for playback.

```bash
npm install
npx expo run:ios -d <device-udid>
```

## Tests

```bash
npx jest
```

## Status

Working end to end on device. See [docs/roadmap.md](docs/roadmap.md) for what's next.
