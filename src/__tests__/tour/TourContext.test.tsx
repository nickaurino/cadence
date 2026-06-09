import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
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

describe('TourProvider', () => {
  it('request shows an unseen coachmark; only one at a time', async () => {
    await mount();
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBe('onTheBeat');
    // a second request while one is showing is ignored
    await act(async () => api.request('paceShift'));
    expect(api.current).toBe('onTheBeat');
  });

  it('dismiss marks seen and hides; a seen coachmark will not re-show', async () => {
    await mount();
    await act(async () => api.request('onTheBeat'));
    await act(async () => api.dismiss('onTheBeat'));
    expect(api.current).toBeNull();
    expect(api.seen.onTheBeat).toBe(true);
    await act(async () => api.request('onTheBeat'));
    expect(api.current).toBeNull(); // already seen
  });

  it('skipAll marks every coachmark seen', async () => {
    await mount();
    await act(async () => api.skipAll());
    expect(api.allSeen).toBe(true);
  });

  it('triggerReplayTour clears seen flags', async () => {
    await mount();
    await act(async () => api.skipAll());
    expect(api.allSeen).toBe(true);
    await act(async () => triggerReplayTour());
    expect(api.allSeen).toBe(false);
  });
});
