import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  CoachmarkId,
  SeenMap,
  allUnseen,
  allSeenMap,
  withSeen,
  shouldShow,
  allSeen as allSeenFn,
} from '@/tour/tourState';
import {
  getCoachmarksSeen,
  saveCoachmarksSeen,
  clearCoachmarksSeen,
  isTourEnabled,
  setTourEnabled,
} from '@/storage/store';

interface TourValue {
  ready: boolean; // seen flags + enabled flag loaded from storage
  // The tour shows coachmarks ONLY while enabled: the first session after
  // onboarding, or the session after Replay tour. Never ordinary sessions.
  enabled: boolean;
  current: CoachmarkId | null; // which coachmark is showing now
  seen: SeenMap;
  allSeen: boolean;
  activate: () => void; // turn the tour on (first session after onboarding)
  deactivate: () => void; // turn it off (tour's session ended without finishing)
  request: (id: CoachmarkId) => void; // show id if enabled, unseen, nothing showing
  dismiss: (id: CoachmarkId) => void; // mark seen, hide; last one disables the tour
  skipAll: () => void; // mark every coachmark seen and disable the tour
}

const noop = () => {};
const TourContext = createContext<TourValue>({
  ready: false,
  enabled: false,
  current: null,
  seen: allUnseen(),
  allSeen: false,
  activate: noop,
  deactivate: noop,
  request: noop,
  dismiss: noop,
  skipAll: noop,
});

// Module-level shim so Settings can replay the tour without prop-drilling through
// the tree (mirrors the hobby-randomizer pattern).
let _replay: (() => void) | null = null;
export function registerTourReplay(fn: () => void) {
  _replay = fn;
}
export function triggerReplayTour() {
  _replay?.();
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [seen, setSeen] = useState<SeenMap>(allUnseen());
  const [current, setCurrent] = useState<CoachmarkId | null>(null);

  useEffect(() => {
    Promise.all([getCoachmarksSeen(), isTourEnabled()]).then(([s, e]) => {
      setSeen(s);
      setEnabled(e);
      setReady(true);
    });
  }, []);

  // Persist via a functional updater so we never write a stale `seen` snapshot.
  const persist = (update: (prev: SeenMap) => SeenMap) => {
    setSeen((prev) => {
      const next = update(prev);
      saveCoachmarksSeen(next).catch(() => {});
      return next;
    });
  };

  const setEnabledPersisted = (e: boolean) => {
    setEnabled(e);
    setTourEnabled(e).catch(() => {});
  };

  const activate = () => setEnabledPersisted(true);

  const deactivate = () => {
    setEnabledPersisted(false);
    setCurrent(null);
  };

  const request = (id: CoachmarkId) => {
    if (!enabled) return;
    setCurrent((cur) => (shouldShow(seen, cur, id) ? id : cur));
  };

  const dismiss = (id: CoachmarkId) => {
    persist((prev) => withSeen(prev, id));
    setCurrent((cur) => (cur === id ? null : cur));
    // If that was the last coachmark, the all-seen effect below disables the tour.
  };

  const skipAll = () => {
    persist(() => allSeenMap());
    setEnabledPersisted(false);
    setCurrent(null);
  };

  // When every coachmark is seen, the tour is complete: disable it.
  useEffect(() => {
    if (ready && enabled && allSeenFn(seen)) setEnabledPersisted(false);
  }, [ready, enabled, seen]);

  // Replay tour: clear seen flags and re-enable for the next session.
  useEffect(() => {
    registerTourReplay(() => {
      clearCoachmarksSeen().catch(() => {});
      setSeen(allUnseen());
      setCurrent(null);
      setEnabledPersisted(true);
    });
  }, []);

  return (
    <TourContext.Provider
      value={{
        ready,
        enabled,
        current,
        seen,
        allSeen: allSeenFn(seen),
        activate,
        deactivate,
        request,
        dismiss,
        skipAll,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
