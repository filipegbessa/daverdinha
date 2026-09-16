import { getCoveredDeliveryZones } from './delivery-zones';

describe('getCoveredDeliveryZones', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    jest.restoreAllMocks();
  });

  it('reads the covered zones from the API, cached for a minute', async () => {
    const zones = [{ zone: 'Centro', bairros: ['Gamboa', 'Santo Cristo'] }];
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => zones });

    await expect(getCoveredDeliveryZones()).resolves.toEqual(zones);
    expect(global.fetch).toHaveBeenCalledWith('https://api.test/delivery-locations/covered', {
      next: { revalidate: 60 },
    });
  });

  it('hides the section rather than guessing when the API errors out', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(getCoveredDeliveryZones()).resolves.toEqual([]);
  });

  it('hides the section when the API is unreachable', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(getCoveredDeliveryZones()).resolves.toEqual([]);
  });

  it('does not even try when the API URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    await expect(getCoveredDeliveryZones()).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
