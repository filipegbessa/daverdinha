import { breadcrumbJsonLd, eventJsonLd, productJsonLd, serializeJsonLd } from './structured-data';
import { SAMPLE_PRODUCTS, sampleEvents } from '@/features/site/data/samples';

describe('structured data', () => {
  const originalSiteUrl = process.env.SITE_URL;

  beforeEach(() => {
    process.env.SITE_URL = 'https://daverdinha.com.br';
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
  });

  it('builds a breadcrumb with absolute URLs, in order', () => {
    expect(
      breadcrumbJsonLd([
        { name: 'Início', path: '/' },
        { name: 'Produtos', path: '/produtos' },
      ]),
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Início', item: 'https://daverdinha.com.br/' },
        { position: 2, name: 'Produtos', item: 'https://daverdinha.com.br/produtos' },
      ],
    });
  });

  it('describes a product with its price in BRL and its nested URL', () => {
    const product = SAMPLE_PRODUCTS[0];
    expect(productJsonLd(product)).toMatchObject({
      '@type': 'Product',
      name: 'Vaso Terracota M',
      offers: {
        price: '89.90',
        priceCurrency: 'BRL',
        url: 'https://daverdinha.com.br/produtos/vasos/vaso-terracota-m',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  it('tells Google when a product is made to order or sold out', () => {
    const [product] = SAMPLE_PRODUCTS;

    expect(productJsonLd({ ...product, availability: 'made_to_order', leadTimeDays: 10 })).toMatchObject({
      offers: { availability: 'https://schema.org/MadeToOrder' },
    });
    expect(productJsonLd({ ...product, availability: 'sold_out' })).toMatchObject({
      offers: { availability: 'https://schema.org/OutOfStock' },
    });
  });

  it('places an event at the atelier when it has no location of its own', () => {
    const [atAtelier, elsewhere] = sampleEvents(new Date('2026-11-04T12:00:00Z'));

    expect(eventJsonLd(atAtelier)).toMatchObject({
      '@type': 'Event',
      location: { address: { streetAddress: 'R. Capiberibe, 32' } },
      offers: { price: '120.00' },
    });
    expect(eventJsonLd(elsewhere)).toMatchObject({
      location: { name: 'Praça da Harmonia' },
      offers: { price: '0.00' },
    });
  });

  it('cannot be broken out of its script tag by admin text', () => {
    expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
