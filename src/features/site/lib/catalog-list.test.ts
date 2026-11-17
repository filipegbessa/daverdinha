import {
  applyCatalogParams,
  catalogQuery,
  normalizeSearch,
  parseCatalogParams,
  searchProducts,
  sortProducts,
} from './catalog-list';
import type { Product } from '@/features/site/types/catalog';

const product = (overrides: Partial<Product>): Product => ({
  id: overrides.name ?? 'p',
  name: 'Produto',
  slug: 'produto',
  description: '',
  price: 10,
  images: [],
  category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
  availability: 'in_stock',
  leadTimeDays: null,
  ...overrides,
});

const names = (products: Product[]) => products.map((p) => p.name);

describe('normalizeSearch', () => {
  it('drops accents, case and punctuation', () => {
    expect(normalizeSearch('Costela-de-Adão ')).toBe('costela de adao');
  });
});

describe('searchProducts', () => {
  const catalog = [
    product({ name: 'Kit Kokedama', description: 'Musgo e uma muda de costela-de-adão.' }),
    product({ name: 'Costela-de-Adão', category: { id: 'c2', name: 'Mudas', slug: 'mudas' } }),
    product({ name: 'Vaso Terracota' }),
  ];

  it('finds by name or description ignoring accents, name matches first', () => {
    expect(names(searchProducts(catalog, 'costela de adao'))).toEqual(['Costela-de-Adão', 'Kit Kokedama']);
  });

  it('needs every word, across name and category', () => {
    expect(names(searchProducts(catalog, 'terracota vasos'))).toEqual(['Vaso Terracota']);
    expect(searchProducts(catalog, 'terracota mudas')).toEqual([]);
  });

  it('returns nothing for an empty query', () => {
    expect(searchProducts(catalog, '  - ')).toEqual([]);
  });
});

describe('sortProducts', () => {
  const list = [
    product({ name: 'B', price: 50, createdAt: '2026-01-01T00:00:00Z' }),
    product({ name: 'Esgotado', price: 5, availability: 'sold_out', createdAt: '2026-12-01T00:00:00Z' }),
    product({ name: 'A', price: 20, createdAt: '2026-06-01T00:00:00Z' }),
  ];

  it('keeps the catalog order for highlights', () => {
    expect(names(sortProducts(list, 'relevance'))).toEqual(['B', 'Esgotado', 'A']);
  });

  it('sorts by price and by newest, with sold out last', () => {
    expect(names(sortProducts(list, 'price_asc'))).toEqual(['A', 'B', 'Esgotado']);
    expect(names(sortProducts(list, 'price_desc'))).toEqual(['B', 'A', 'Esgotado']);
    expect(names(sortProducts(list, 'newest'))).toEqual(['A', 'B', 'Esgotado']);
  });
});

describe('applyCatalogParams', () => {
  it('filters by availability', () => {
    const list = [product({ name: 'Pronto' }), product({ name: 'Encomenda', availability: 'made_to_order' })];
    expect(names(applyCatalogParams(list, { sort: 'relevance', filter: 'made_to_order' }))).toEqual(['Encomenda']);
  });
});

describe('parseCatalogParams / catalogQuery', () => {
  it('falls back to the defaults on unknown values and keeps only what changed', () => {
    const params = parseCatalogParams({ q: ' vaso ', ordem: 'xyz', tipo: 'in_stock', page: '2' });
    expect(params).toEqual({ q: 'vaso', sort: 'relevance', filter: 'in_stock', page: '2' });
    expect(catalogQuery(params)).toEqual({ q: 'vaso', tipo: 'in_stock' });
  });
});
