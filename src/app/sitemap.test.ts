import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import sitemap from './sitemap';

describe('sitemap', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.SITE_URL = 'https://daverdinha.com.br';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    jest.restoreAllMocks();
  });

  it('lists only the homepage and privacy policy before launch', async () => {
    mockSiteSettings({ siteEnabled: false });

    const result = await sitemap();
    expect(result).toEqual([
      {
        url: 'https://daverdinha.com.br',
        lastModified: expect.any(Date),
        changeFrequency: 'monthly',
        priority: 1,
      },
      {
        url: 'https://daverdinha.com.br/politica-de-privacidade',
        lastModified: expect.any(Date),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('adds the catalog, categories with products, products and events after launch', async () => {
    mockSiteSettings({ siteEnabled: true });
    const responses: Record<string, unknown> = {
      'https://api.test/product-categories/active': [
        { id: 'c1', name: 'Vasos', slug: 'vasos', description: '' },
        { id: 'c2', name: 'Kits', slug: 'kits', description: '' },
      ],
      'https://api.test/products/active': [
        {
          id: 'p1',
          name: 'Vaso',
          slug: 'vaso',
          description: '',
          price: 10,
          images: [],
          category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
        },
      ],
      'https://api.test/events/upcoming': [{ id: 'e1', slug: 'oficina' }],
    };
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => responses[url],
    }));

    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://daverdinha.com.br/produtos',
        'https://daverdinha.com.br/agenda',
        'https://daverdinha.com.br/produtos/vasos',
        'https://daverdinha.com.br/produtos/vasos/vaso',
        'https://daverdinha.com.br/agenda/oficina',
      ]),
    );
    // Kits não tem produto: a página dela é 404, não entra.
    expect(urls).not.toContain('https://daverdinha.com.br/produtos/kits');
  });
});
