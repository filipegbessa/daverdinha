import {
  getActiveCategories,
  getActiveProductBySlug,
  getActiveProducts,
  getEventBySlug,
  getFeaturedProducts,
  getHeroSlides,
  getUpcomingEvents,
} from './public-api';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';
import { isSample } from '@/features/site/data/samples';

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
  const originalMode = process.env.SITE_MODE;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    if (originalMode === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = originalMode;
    jest.restoreAllMocks();
  });

  describe('after launch (SITE_MODE=full)', () => {
    beforeEach(() => {
      process.env.SITE_MODE = 'full';
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

    // A rota de slides ainda não existe na API: a home não pode ficar sem topo.
    it('falls back to the single default hero slide, so there is no slideshow', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getHeroSlides()).resolves.toEqual([DEFAULT_HERO_SLIDE]);
    });
  });

  describe('before launch (preview)', () => {
    beforeEach(() => {
      delete process.env.SITE_MODE;
    });

    it('prefers real data when the API has it', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [product] });

      await expect(getActiveProducts()).resolves.toEqual([product]);
    });

    it('falls back to sample data so the client can validate the layout', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const products = await getActiveProducts('mudas');
      expect(products.length).toBeGreaterThan(0);
      expect(products.every(isSample)).toBe(true);
      expect(products.every((p) => p.category.slug === 'mudas')).toBe(true);

      const events = await getUpcomingEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e) => new Date(e.endsAt).getTime() > Date.now())).toBe(true);
    });

    it('resolves sample products and events by slug', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getActiveProductBySlug('vaso-terracota-m')).resolves.toMatchObject({ name: 'Vaso Terracota M' });
      await expect(getEventBySlug('oficina-de-terrario')).resolves.toMatchObject({ title: 'Oficina de terrário' });
      await expect(getActiveProductBySlug('nao-existe')).resolves.toBeNull();
    });
  });
});
