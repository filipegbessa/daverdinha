import { getActiveHeroSlides } from './hero-slides';

describe('getActiveHeroSlides', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  });

  it('returns the parsed slide list on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: '1' }] }) as any;
    const result = await getActiveHeroSlides();
    expect(result).toEqual([{ id: '1' }]);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/hero-slides/active', { next: { revalidate: 60 } });
  });

  it('returns an empty array when the API URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const result = await getActiveHeroSlides();
    expect(result).toEqual([]);
  });

  it('returns an empty array when the backend responds with an error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
    const result = await getActiveHeroSlides();
    expect(result).toEqual([]);
  });

  it('returns an empty array when the fetch throws (backend unreachable)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as any;
    const result = await getActiveHeroSlides();
    expect(result).toEqual([]);
  });
});
