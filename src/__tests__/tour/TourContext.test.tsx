import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourProvider, useTour, triggerReplayTour } from '@/tour/TourContext';
import { TOUR_STEPS, TOUR_STEP_COUNT } from '@/tour/script';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

let api: ReturnType<typeof useTour>;
function Probe() {
  api = useTour();
  return <Text>{api.step?.id ?? 'none'}</Text>;
}

async function mount() {
  let r: ReturnType<typeof create>;
  await act(async () => {
    r = create(
      <TourProvider>
        <Probe />
      </TourProvider>
    );
  });
  return r!;
}

beforeEach(() => AsyncStorage.clear());

describe('TourProvider (scripted tour)', () => {
  it('not pending by default: ordinary launches never run the tour', async () => {
    await mount();
    expect(api.pending).toBe(false);
    expect(api.running).toBe(false);
    expect(api.step).toBeNull();
  });

  it('replay arms the tour; begin starts at step 0 on home', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    expect(api.pending).toBe(true);
    await act(async () => api.begin());
    expect(api.running).toBe(true);
    expect(api.step?.id).toBe('home-start');
  });

  it('advanceFrom walks the script; past the last step it is finished', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    for (const s of TOUR_STEPS) {
      expect(api.finished).toBe(false);
      expect(api.step?.id).toBe(s.id);
      await act(async () => api.advanceFrom(s.id));
    }
    expect(api.step).toBeNull();
    expect(api.finished).toBe(true);
  });

  it('advanceFrom is idempotent: double-taps and stale step ids are no-ops', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    // double-fire the same step
    await act(async () => {
      api.advanceFrom('home-start');
      api.advanceFrom('home-start');
    });
    expect(api.stepIndex).toBe(1); // advanced exactly once
    // a stale id (not the current step) does nothing
    await act(async () => api.advanceFrom('active-hold'));
    expect(api.stepIndex).toBe(1);
  });

  it('skip ends the tour, clears pending, AND removes the persisted flag', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    await act(async () => api.skip());
    expect(api.running).toBe(false);
    expect(api.pending).toBe(false);
    // disk agrees: a silently-failed disarm would resurrect the tour next launch
    expect(await AsyncStorage.getItem('tour_enabled')).toBeNull();
  });

  it('end after finishing clears pending in memory and on disk', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    await act(async () => api.end());
    expect(api.pending).toBe(false);
    expect(await AsyncStorage.getItem('tour_enabled')).toBeNull();
  });

  it('pending persists across provider remounts (kill mid-tour restarts it)', async () => {
    const first = await mount();
    await act(async () => triggerReplayTour());
    await act(async () => first.unmount());
    await mount();
    expect(api.pending).toBe(true); // still armed; home will begin() again
    expect(api.running).toBe(false);
  });

  it('finished only past the final step, and step count matches the script', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    for (let i = 0; i < TOUR_STEP_COUNT - 1; i++) {
      await act(async () => api.advanceFrom(api.step!.id));
    }
    expect(api.finished).toBe(false); // on the last step, not past it
    expect(api.step?.id).toBe('active-hold');
    await act(async () => api.advanceFrom('active-hold'));
    expect(api.finished).toBe(true);
  });
});
