import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourProvider, useTour, triggerReplayTour } from '@/tour/TourContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

let api: ReturnType<typeof useTour>;
function Probe() {
  api = useTour();
  return <Text>{api.current ?? 'none'}</Text>;
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

describe('TourProvider', () => {
  it('starts disabled: request does nothing until the tour is activated', async () => {
    await mount();
    expect(api.enabled).toBe(false);
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBeNull(); // ordinary session: no coachmarks
  });

  it('when activated, request shows an unseen coachmark; only one at a time', async () => {
    await mount();
    await act(async () => api.activate());
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBe('onTheBeat');
    // a second request while one is showing is ignored
    await act(async () => api.request('paceShift'));
    expect(api.current).toBe('onTheBeat');
  });

  it('dismiss marks seen and hides; a seen coachmark will not re-show', async () => {
    await mount();
    await act(async () => api.activate());
    await act(async () => api.request('onTheBeat'));
    await act(async () => api.dismiss('onTheBeat'));
    expect(api.current).toBeNull();
    expect(api.seen.onTheBeat).toBe(true);
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBeNull(); // already seen
  });

  it('dismissing the last coachmark completes and disables the tour', async () => {
    await mount();
    await act(async () => api.activate());
    for (const id of ['onTheBeat', 'paceShift', 'paceLock', 'holdToEnd'] as const) {
      await act(async () => api.request(id));
      await act(async () => api.dismiss(id));
    }
    expect(api.allSeen).toBe(true);
    expect(api.enabled).toBe(false); // complete -> off, no leak into later sessions
  });

  it('skipAll marks every coachmark seen and disables the tour', async () => {
    await mount();
    await act(async () => api.activate());
    await act(async () => api.skipAll());
    expect(api.allSeen).toBe(true);
    expect(api.enabled).toBe(false);
  });

  it('deactivate turns the tour off without marking anything seen', async () => {
    await mount();
    await act(async () => api.activate());
    await act(async () => api.deactivate());
    expect(api.enabled).toBe(false);
    expect(api.allSeen).toBe(false);
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBeNull(); // disabled: nothing shows
  });

  it('triggerReplayTour clears seen flags and re-enables the tour', async () => {
    await mount();
    await act(async () => api.activate());
    await act(async () => api.skipAll());
    expect(api.enabled).toBe(false);
    await act(async () => triggerReplayTour());
    expect(api.allSeen).toBe(false);
    expect(api.enabled).toBe(true);
  });

  it('enabled state persists across provider remounts (session resume mid-tour)', async () => {
    const first = await mount();
    await act(async () => api.activate());
    await act(async () => first.unmount());
    await mount();
    expect(api.enabled).toBe(true); // resumed mid-tour: still on
    expect(api.allSeen).toBe(false);
  });
});
