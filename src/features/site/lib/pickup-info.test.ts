import { getPickupInfo } from './pickup-info';

describe('getPickupInfo', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = { ...env };
  });

  const respond = (body: unknown, ok = true) =>
    (global.fetch as jest.Mock).mockResolvedValue({ ok, json: async () => body });

  it('reads the pickup from the public store settings', async () => {
    respond({
      pickupEnabled: true,
      pickupAddress: 'R. Capiberibe, 32',
      pickupHours: 'Seg a sex',
      pickupInstructions: '',
    });

    await expect(getPickupInfo()).resolves.toEqual({
      address: 'R. Capiberibe, 32',
      hours: 'Seg a sex',
      instructions: null,
    });
    expect(global.fetch).toHaveBeenCalledWith('https://api.test/store-settings/public', expect.anything());
  });

  it('is null when pickup is off, the API fails or there is no API', async () => {
    respond({ pickupEnabled: false, pickupAddress: 'x', pickupHours: 'y' });
    await expect(getPickupInfo()).resolves.toBeNull();

    respond({}, false);
    await expect(getPickupInfo()).resolves.toBeNull();

    (global.fetch as jest.Mock).mockRejectedValue(new Error('down'));
    await expect(getPickupInfo()).resolves.toBeNull();

    delete process.env.NEXT_PUBLIC_API_URL;
    await expect(getPickupInfo()).resolves.toBeNull();
  });
});
