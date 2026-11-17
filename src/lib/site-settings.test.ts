jest.unmock('@/lib/site-settings');

describe('getSiteSettings', () => {
  const originalUrl = process.env.NEXT_PUBLIC_API_URL;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalUrl;
  });

  // `cache()` do React guarda o resultado; cada teste carrega o módulo de novo.
  async function load() {
    let getSiteSettings: (() => Promise<unknown>) | undefined;
    jest.isolateModules(() => {
      ({ getSiteSettings } = jest.requireActual<typeof import('./site-settings')>('./site-settings'));
    });
    return getSiteSettings!();
  }

  it('reads both switches from the public store settings, cached for a minute', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ siteEnabled: true, storeEnabled: false, maxInstallments: 3 }),
    });

    await expect(load()).resolves.toEqual({ siteEnabled: true, storeEnabled: false, storePause: null });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example/store-settings/public', {
      next: { revalidate: 60, tags: ['site-settings'] },
    });
  });

  it('turns both off when the API fails, answers an error or has no URL', async () => {
    fetchMock.mockRejectedValue(new Error('down'));
    await expect(load()).resolves.toEqual({ siteEnabled: false, storeEnabled: false, storePause: null });

    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(load()).resolves.toEqual({ siteEnabled: false, storeEnabled: false, storePause: null });

    delete process.env.NEXT_PUBLIC_API_URL;
    await expect(load()).resolves.toEqual({ siteEnabled: false, storeEnabled: false, storePause: null });
  });

  it('only accepts a real true, never a truthy-looking value', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ siteEnabled: 'true', storeEnabled: 1 }) });

    await expect(load()).resolves.toEqual({ siteEnabled: false, storeEnabled: false, storePause: null });
  });

  it('reads the store pause, when there is one', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        siteEnabled: true,
        storeEnabled: true,
        storePause: { message: 'Férias!', until: '2027-01-06T03:00:00.000Z' },
      }),
    });

    await expect(load()).resolves.toEqual({
      siteEnabled: true,
      storeEnabled: true,
      storePause: { message: 'Férias!', until: '2027-01-06T03:00:00.000Z' },
    });
  });
});
