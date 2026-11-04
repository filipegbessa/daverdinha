import type { MetadataRoute } from 'next';
import { getSiteMode } from '@/lib/site-mode';
import { AGENDA_HREF, categoryHref, eventHref, PRODUCTS_HREF, productHref } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL must be set to build the sitemap');
  }

  const base: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Antes do lançamento o catálogo e a agenda são prévia (noindex, com dados
  // de exemplo) — não entram no sitemap.
  if (getSiteMode() !== 'full') return base;

  const [categories, products, events] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(),
    getUpcomingEvents(),
  ]);
  // Só categoria com produto: as outras respondem 404.
  const withProducts = new Set(products.map((p) => p.category.slug));
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority,
  });

  return [
    ...base,
    page(PRODUCTS_HREF, 0.9),
    page(AGENDA_HREF, 0.8),
    ...categories.filter((c) => withProducts.has(c.slug)).map((c) => page(categoryHref(c.slug), 0.8)),
    ...products.map((p) => page(productHref(p), 0.7)),
    ...events.map((e) => page(eventHref(e), 0.6)),
  ];
}
