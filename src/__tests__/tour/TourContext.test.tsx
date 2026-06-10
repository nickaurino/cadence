import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourProvider, useTour, triggerReplayTour } from '@/tour/TourContext';
import { TOUR_STEP_COUNT } from '@/tour/script';

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

  it('advance walks the script; past the last step it is finished (handoff time)', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    for (let i = 0; i < TOUR_STEP_COUNT; i++) {
      expect(api.finished).toBe(false);
      await act(async () => api.advance());
    }
    expect(api.step).toBeNull();
    expect(api.finished).toBe(true);
  });

  it('chooseMode records real or demo', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    await act(async () => api.chooseMode('demo'));
    expect(api.mode).toBe('demo');
  });

  it('skip ends the tour and clears pending (no leak into later sessions)', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    await act(async () => api.skip());
    expect(api.running).toBe(false);
    expect(api.pending).toBe(false);
  });

  it('end after finishing clears pending', async () => {
    await mount();
    await act(async () => triggerReplayTour());
    await act(async () => api.begin());
    await act(async () => api.end());
    expect(api.pending).toBe(false);
  });

  it('pending persists across provider remounts (kill mid-tour restarts it)', async () => {
    const first = await mount();
    await act(async () => triggerReplayTour());
    await act(async () => first.unmount());
    await mount();
    expect(api.pending).toBe(true); // still armed; home will begin() again
    expect(api.running).toBe(false);
  });
});
