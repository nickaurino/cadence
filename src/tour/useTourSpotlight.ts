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
  // The measured rect is tagged with the step it belongs to. `measuring` is
  // DERIVED from that tag, not set in an effect: on the render where the step
  // advances, the tag still names the old step, so the card hides on that very
  // frame. (An effect-set flag ran one frame late, and the new step's copy
  // painted at the old step's position before snapping down.)
  const [measured, setMeasured] = useState<{ stepId: string; rect: TargetRect } | null>(null);
  // true once BOTH measure attempts fail (a real failure, not the brief 1-frame
  // measuring window). Lets the screen show a centered card fallback only then,
  // so the normal window never flashes a wrongly-positioned card.
  const [failed, setFailed] = useState(false);
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
    // flash. While measuring, the overlay blocks everything (so the stale
    // cutout is not a touch hole) and hides the card until the new rect lands;
    // on outright failure it falls back to a centered card.
    setFailed(false);
    if (!step) {
      setMeasured(null);
      return;
    }
    let retry: ReturnType<typeof setTimeout> | null = null;
    const fail = () => {
      if (!mounted.current) return;
      setMeasured(null);
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
        setMeasured({ stepId: step.id, rect: { x: pageX, y: pageY, width, height } });
      });
    };
    // Wait a frame so the screen has laid out before measuring.
    const raf = requestAnimationFrame(() => measure(0));
    return () => {
      cancelAnimationFrame(raf);
      if (retry) clearTimeout(retry);
    };
  }, [step?.id]);

  const measuring = !!step && !failed && measured?.stepId !== step.id;
  return { tour, step, targetRect: measured?.rect ?? null, failed, measuring };
}
