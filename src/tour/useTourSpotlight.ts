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
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const step: TourStep | null = tour.step && tour.step.screen === screen ? tour.step : null;

  useEffect(() => {
    if (!step) {
      setTargetRect(null);
      return;
    }
    let retry: ReturnType<typeof setTimeout> | null = null;
    const measure = (attempt: number) => {
      const node = refs[step.target]?.current;
      if (!node) {
        if (attempt === 0) retry = setTimeout(() => measure(1), 350);
        return;
      }
      node.measure((_x, _y, width, height, pageX, pageY) => {
        if (!mounted.current) return;
        if (width === 0 && height === 0) {
          if (attempt === 0) retry = setTimeout(() => measure(1), 350);
          return;
        }
        setTargetRect({ x: pageX, y: pageY, width, height });
      });
    };
    // Wait a frame so the screen has laid out before measuring.
    const raf = requestAnimationFrame(() => measure(0));
    return () => {
      cancelAnimationFrame(raf);
      if (retry) clearTimeout(retry);
    };
  }, [step?.id]);

  return { tour, step, targetRect };
}
