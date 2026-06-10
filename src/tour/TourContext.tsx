import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TourStep, stepAt, TOUR_STEP_COUNT } from '@/tour/script';
import { isTourEnabled, setTourEnabled } from '@/storage/store';

export type TourMode = 'real' | 'demo' | null;

interface TourValue {
  ready: boolean; // pending flag loaded from storage
  // pending: the tour should run. Set on onboarding completion and by Replay
  // tour; cleared when the tour finishes or is skipped. Persisted, so a kill
  // mid-tour restarts it from the top on the next visit to home.
  pending: boolean;
  running: boolean; // the tour is live right now
  mode: TourMode; // chosen at the session step: real session or simulated
  stepIndex: number;
  step: TourStep | null; // null when not running or past the last step
  finished: boolean; // ran past the last step (time for the handoff)
  begin: () => void; // home calls this when ready && pending
  chooseMode: (mode: Exclude<TourMode, null>) => void;
  advance: () => void;
  skip: () => void; // bail out entirely
  end: () => void; // normal completion (after the handoff)
}

const noop = () => {};
const TourContext = createContext<TourValue>({
  ready: false,
  pending: false,
  running: false,
  mode: null,
  stepIndex: 0,
  step: null,
  finished: false,
  begin: noop,
  chooseMode: noop,
  advance: noop,
  skip: noop,
  end: noop,
});

// Module-level shim so Settings can replay the tour without prop-drilling
// (mirrors the hobby-randomizer pattern).
let _replay: (() => void) | null = null;
export function registerTourReplay(fn: () => void) {
  _replay = fn;
}
export function triggerReplayTour() {
  _replay?.();
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<TourMode>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    isTourEnabled().then((p) => {
      setPending(p);
      setReady(true);
    });
  }, []);

  const setPendingPersisted = (p: boolean) => {
    setPending(p);
    setTourEnabled(p).catch(() => {});
  };

  const begin = () => {
    setStepIndex(0);
    setMode(null);
    setRunning(true);
  };

  const chooseMode = (m: Exclude<TourMode, null>) => setMode(m);

  const advance = () => setStepIndex((i) => i + 1);

  const stop = () => {
    setRunning(false);
    setMode(null);
    setStepIndex(0);
    setPendingPersisted(false);
  };

  const skip = stop;
  const end = stop;

  useEffect(() => {
    registerTourReplay(() => setPendingPersisted(true));
  }, []);

  const step = running ? stepAt(stepIndex) : null;
  const finished = running && stepIndex >= TOUR_STEP_COUNT;

  return (
    <TourContext.Provider
      value={{
        ready,
        pending,
        running,
        mode,
        stepIndex,
        step,
        finished,
        begin,
        chooseMode,
        advance,
        skip,
        end,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
