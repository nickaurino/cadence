import { useEffect, useRef, useState, RefObject } from 'react';
import { View } from 'react-native';
import { TargetRect } from '@/components/SpotlightOverlay';
import { TourScreen, TourStep, TourTarget } from '@/tour/script';
import { useTour } from '@/tour/TourContext';

type RefMap = Partial<Record<TourTarget, RefObject<View | null>>>;

// Drives the spotlight for one screen of the scripted tour: when the current
// step belongs to `screen`, measures its target ref into screen coordinates
// (pageX/pageY map straight into the absolute-fill overlay because every screen
// uses a full-bleed SafeAreaView with edges={[]}; see the invariant note in the
// spec). Retries once after a beat for not-yet-laid-out targets.
export function useTourSpotlight(screen: TourScreen, refs: RefMap) {
  const tour = useTour();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  // true once BOTH measure attempts fail (a real failure, not the brief 1-frame
  // measuring window). Lets the screen show a centered card fallback only then,
  // so the normal window never flashes a wrongly-positioned card.
  const [failed, setFailed] = useState(false);
  // true while the new step's target is being measured. The previous step's
  // rect is kept on screen during this window (no full-dark flash between
  // steps); the overlay blocks ALL touches and hides the card until the new
  // rect lands, so the stale cutout is never a touch hole.
  const [measuring, setMeasuring] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true; // re-set on remount (cleanup below flips it false)
    return () => {
      mounted.current = false;
    };
  }, []);

  const step: TourStep | null = tour.step && tour.step.screen === screen ? tour.step : null;

  useEffect(() => {
    // On step change, KEEP the previous rect on screen while the new target is
    // measured: cutting to a full-dark frame between steps read as a glitchy
    // flash. `measuring` makes the overlay block everything (so the stale
    // cutout is not a touch hole) and hide the card until the new rect lands;
    // on outright failure it falls back to a centered card.
    setFailed(false);
    if (!step) {
      setTargetRect(null);
      setMeasuring(false);
      return;
    }
    setMeasuring(true);
    let retry: ReturnType<typeof setTimeout> | null = null;
    const fail = () => {
      if (!mounted.current) return;
      setTargetRect(null);
      setMeasuring(false);
      setFailed(true);
    };
    const measure = (attempt: number) => {
      const node = refs[step.target]?.current;
      if (!node) {
        if (attempt === 0) retry = setTimeout(() => measure(1), 350);
        else fail();
        return;
      }
      node.measure((_x, _y, width, height, pageX, pageY) => {
        if (!mounted.current) return;
        if (width === 0 && height === 0) {
          if (attempt === 0) retry = setTimeout(() => measure(1), 350);
          else fail();
          return;
        }
        setTargetRect({ x: pageX, y: pageY, width, height });
        setMeasuring(false);
      });
    };
    // Wait a frame so the screen has laid out before measuring.
    const raf = requestAnimationFrame(() => measure(0));
    return () => {
      cancelAnimationFrame(raf);
      if (retry) clearTimeout(retry);
    };
  }, [step?.id]);

  return { tour, step, targetRect, failed, measuring };
}
