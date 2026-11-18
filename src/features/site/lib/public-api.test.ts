import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import {
  getAbout,
  getActiveCategories,
  getActiveProductBySlug,
  getActiveProducts,
  getEventBySlug,
  getFeaturedProducts,
  getHeroSlides,
  getUpcomingEvents,
} from './public-api';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';

const product = {
  id: 'p1',
  name: 'Vaso Real',
  slug: 'vaso-real',
  description: '',
  price: 50,
  images: [],
  category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
};

describe('public API reads', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    jest.restoreAllMocks();
  });

  describe('after launch (site ligado no Dashboard)', () => {
    beforeEach(() => {
      mockSiteSettings({ siteEnabled: true });
    });

    it('reads products from the API, cached for a minute', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [product] });

      await expect(getActiveProducts('vasos')).resolves.toEqual([product]);
      expect(global.fetch).toHaveBeenCalledWith('https://api.test/products/active?category=vasos', {
        next: { revalidate: 60 },
      });
    });

    it('never shows sample data: an empty or failing API means an empty list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
      await expect(getActiveCategories()).resolves.toEqual([]);

      (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(getUpcomingEvents()).resolves.toEqual([]);
    });

    it('returns null for a product or event the API does not have', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getActiveProductBySlug('vaso-terracota-m')).resolves.toBeNull();
      await expect(getEventBySlug('oficina-de-terrario')).resolves.toBeNull();
    });

    it('asks the API for featured products only', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [product] });

      await expect(getFeaturedProducts()).resolves.toEqual([product]);
      expect(global.fetch).toHaveBeenCalledWith('https://api.test/products/active?featured=true', {
        next: { revalidate: 60 },
      });
    });

    // Sem slide no ar ou com a API fora, a home não pode ficar sem topo.
    it('falls back to the single default hero slide, so there is no slideshow', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getHeroSlides()).resolves.toEqual([DEFAULT_HERO_SLIDE]);

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
      await expect(getHeroSlides()).resolves.toEqual([DEFAULT_HERO_SLIDE]);
    });

    it('shows the hero slides that are live in the admin', async () => {
      const slide = { ...DEFAULT_HERO_SLIDE, id: 's1', title: 'Kits pra presentear' };
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [slide] });

      await expect(getHeroSlides()).resolves.toEqual([slide]);
      expect(global.fetch).toHaveBeenCalledWith('https://api.test/hero-slides/active', { next: { revalidate: 60 } });
    });

    it('uses the "Sobre" from the admin only once it was saved', async () => {
      const saved = {
        configured: true,
        title: 'T',
        text: 'X',
        imageUrl: null,
        instagramLabel: null,
        updatedAt: '2026-11-18T12:00:00.000Z',
      };
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => saved });
      await expect(getAbout()).resolves.toEqual(saved);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...saved, configured: false, title: null, text: null }),
      });
      await expect(getAbout()).resolves.toBeNull();

      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
      await expect(getAbout()).resolves.toBeNull();
    });
  });

  describe('before launch (preview)', () => {
    beforeEach(() => {
      mockSiteSettings({ siteEnabled: false });
    });

    it('prefers real data when the API has it', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [product] });

      await expect(getActiveProducts()).resolves.toEqual([product]);
    });

    it('shows only what is registered: no sample products or events anymore', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getActiveProducts('mudas')).resolves.toEqual([]);
      await expect(getUpcomingEvents()).resolves.toEqual([]);
      await expect(getActiveProductBySlug('vaso-terracota-m')).resolves.toBeNull();
      await expect(getEventBySlug('oficina-de-terrario')).resolves.toBeNull();
    });
  });
});
