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

describe('canReadMotion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('true when the pedometer is available and permission is granted', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockResolvedValue({ granted: true });
    expect(await canReadMotion()).toBe(true);
  });

  it('false when permission is not granted', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockResolvedValue({ granted: false });
    expect(await canReadMotion()).toBe(false);
  });

  it('false when the pedometer is unavailable (does not check permission)', async () => {
    mockAvail.mockResolvedValue(false);
    expect(await canReadMotion()).toBe(false);
    expect(mockPerms).not.toHaveBeenCalled();
  });

  it('false (not throwing) if the permission check errors', async () => {
    mockAvail.mockResolvedValue(true);
    mockPerms.mockRejectedValue(new Error('nope'));
    expect(await canReadMotion()).toBe(false);
  });
});
