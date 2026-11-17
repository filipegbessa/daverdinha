import { productFeedXml } from './product-feed';
import type { Product } from '@/features/site/types/catalog';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Vaso & Cia',
  slug: 'vaso',
  description: 'Terracota\n\nde 18 cm.',
  price: 89.9,
  listPrice: null,
  images: ['https://blob/1.jpg', 'https://blob/2.jpg'],
  category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
  availability: 'in_stock',
  leadTimeDays: null,
  ...overrides,
});

describe('productFeedXml', () => {
  const OLD_ENV = process.env.SITE_URL;
  beforeEach(() => {
    process.env.SITE_URL = 'https://www.daverdinha.com.br';
  });
  afterAll(() => {
    process.env.SITE_URL = OLD_ENV;
  });

  it('writes one escaped item per product with the Google fields', () => {
    const xml = productFeedXml([product()]);

    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(xml).toContain('<g:title>Vaso &amp; Cia</g:title>');
    expect(xml).toContain('<g:description>Terracota de 18 cm.</g:description>');
    expect(xml).toContain('<g:link>https://www.daverdinha.com.br/produtos/vasos/vaso</g:link>');
    expect(xml).toContain('<g:image_link>https://blob/1.jpg</g:image_link>');
    expect(xml).toContain('<g:additional_image_link>https://blob/2.jpg</g:additional_image_link>');
    expect(xml).toContain('<g:price>89.90 BRL</g:price>');
    expect(xml).not.toContain('g:sale_price');
    expect(xml).toContain('<g:availability>in_stock</g:availability>');
  });

  it('sends the full price with the promo as sale_price', () => {
    const xml = productFeedXml([product({ price: 69.9, listPrice: 89.9 })]);

    expect(xml).toContain('<g:price>89.90 BRL</g:price>');
    expect(xml).toContain('<g:sale_price>69.90 BRL</g:sale_price>');
  });

  it('marks sold out as out of stock and made to order as in stock', () => {
    expect(productFeedXml([product({ availability: 'sold_out' })])).toContain('out_of_stock');
    expect(productFeedXml([product({ availability: 'made_to_order' })])).toContain(
      '<g:availability>in_stock</g:availability>',
    );
  });

  it('skips products without a photo', () => {
    expect(productFeedXml([product({ images: [] })])).not.toContain('<item>');
  });
});
