import { canReadMotion } from '@/sensors/cadence';
import { Pedometer } from 'expo-sensors';

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
    getStepCountAsync: jest.fn(),
    watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

const mockAvail = Pedometer.isAvailableAsync as jest.Mock;
const mockSteps = Pedometer.getStepCountAsync as jest.Mock;

// canReadMotion probes actual readability via getStepCountAsync rather than the
// unreliable getPermissionsAsync (which reports 'denied' even when Motion &
// Fitness is enabled). Resolve = readable; throw = genuinely denied.
describe('canReadMotion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('true when the step-count probe resolves (motion readable)', async () => {
    mockAvail.mockResolvedValue(true);
    mockSteps.mockResolvedValue({ steps: 3 });
    expect(await canReadMotion()).toBe(true);
  });

  it('true even when the probe returns zero steps (still readable)', async () => {
    mockAvail.mockResolvedValue(true);
    mockSteps.mockResolvedValue({ steps: 0 });
    expect(await canReadMotion()).toBe(true);
  });

  it('false when the probe throws (genuinely denied)', async () => {
    mockAvail.mockResolvedValue(true);
    mockSteps.mockRejectedValue(new Error('CMErrorMotionActivityNotAuthorized'));
    expect(await canReadMotion()).toBe(false);
  });

  it('false when the pedometer is unavailable (no hardware, no probe)', async () => {
    mockAvail.mockResolvedValue(false);
    expect(await canReadMotion()).toBe(false);
    expect(mockSteps).not.toHaveBeenCalled();
  });
});
