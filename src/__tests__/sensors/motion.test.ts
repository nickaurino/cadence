import { canReadMotion } from '@/sensors/cadence';
import { Pedometer } from 'expo-sensors';

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
    getStepCountAsync: jest.fn(),
  },
}));

const mockAvail = Pedometer.isAvailableAsync as jest.Mock;
const mockPerms = Pedometer.getPermissionsAsync as jest.Mock;

// canReadMotion is biased toward "yes": only a definite negative (no hardware or
// explicit denial) blocks. iOS pedometer permission reads are unreliable, so we
// must not block on undetermined/granted-misread/errors.
describe('canReadMotion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('true when granted', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockResolvedValue({ status: 'granted', granted: true });
    expect(await canReadMotion()).toBe(true);
  });

  it('true when undetermined (the OS prompt resolves it on first read)', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockResolvedValue({ status: 'undetermined', granted: false });
    expect(await canReadMotion()).toBe(true);
  });

  it('false only when explicitly denied', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockResolvedValue({ status: 'denied', granted: false });
    expect(await canReadMotion()).toBe(false);
  });

  it('false when the pedometer is unavailable (no hardware)', async () => {
    mockAvail.mockResolvedValue(false);
    expect(await canReadMotion()).toBe(false);
    expect(mockPerms).not.toHaveBeenCalled();
  });

  it('true (does not block) if the permission check errors', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockRejectedValue(new Error('nope'));
    expect(await canReadMotion()).toBe(true);
  });
});
