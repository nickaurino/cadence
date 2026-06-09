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
import { getCoachmarksSeen, saveCoachmarksSeen, clearCoachmarksSeen } from '@/storage/store';

interface TourValue {
  ready: boolean; // seen flags loaded from storage
  current: CoachmarkId | null; // which coachmark is showing now
  seen: SeenMap;
  allSeen: boolean;
  request: (id: CoachmarkId) => void; // show id if unseen and nothing else showing
  dismiss: (id: CoachmarkId) => void; // mark seen, hide
  skipAll: () => void; // mark every remaining coachmark seen
}

const noop = () => {};
const TourContext = createContext<TourValue>({
  ready: false,
  current: null,
  seen: allUnseen(),
  allSeen: false,
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
  const [seen, setSeen] = useState<SeenMap>(allUnseen());
  const [current, setCurrent] = useState<CoachmarkId | null>(null);

  useEffect(() => {
    getCoachmarksSeen().then((s) => {
      setSeen(s);
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

  const request = (id: CoachmarkId) => {
    setCurrent((cur) => (shouldShow(seen, cur, id) ? id : cur));
  };

  const dismiss = (id: CoachmarkId) => {
    persist((prev) => withSeen(prev, id));
    setCurrent((cur) => (cur === id ? null : cur));
  };

  const skipAll = () => {
    persist(() => allSeenMap());
    setCurrent(null);
  };

  useEffect(() => {
    registerTourReplay(() => {
      clearCoachmarksSeen().catch(() => {});
      setSeen(allUnseen());
      setCurrent(null);
    });
  }, []);

  return (
    <TourContext.Provider
      value={{ ready, current, seen, allSeen: allSeenFn(seen), request, dismiss, skipAll }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
