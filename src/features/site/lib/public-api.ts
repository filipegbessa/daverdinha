import { getSiteMode } from '@/lib/site-mode';
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, sampleEvents } from '@/features/site/data/samples';
import type { Product, ProductCategory } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * Leitura das rotas públicas da API pro site. Mesmo contrato de
 * `getCoveredDeliveryZones`: nunca lança. Falha, 404 ou API sem URL viram
 * `null`, e quem chama decide o que "nada" quer dizer.
 */
async function fetchPublic<T>(path: string): Promise<T | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Antes do lançamento, uma lista vazia vira exemplo, pra cliente conseguir
 * avaliar o layout. Depois do lançamento, vazio é vazio: a seção some, como
 * as outras do site.
 */
function withPreviewFallback<T>(items: T[] | null, samples: () => T[]): T[] {
  if (items && items.length > 0) return items;
  return getSiteMode() === 'full' ? [] : samples();
}

export async function getActiveCategories(): Promise<ProductCategory[]> {
  const categories = await fetchPublic<ProductCategory[]>('/product-categories/active');
  return withPreviewFallback(categories, () => SAMPLE_CATEGORIES);
}

export async function getActiveProducts(categorySlug?: string): Promise<Product[]> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  const products = await fetchPublic<Product[]>(`/products/active${query}`);
  return withPreviewFallback(products, () =>
    categorySlug ? SAMPLE_PRODUCTS.filter((p) => p.category.slug === categorySlug) : SAMPLE_PRODUCTS,
  );
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const product = await fetchPublic<Product>(`/products/active/${encodeURIComponent(slug)}`);
  if (product) return product;
  if (getSiteMode() === 'full') return null;
  return SAMPLE_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getUpcomingEvents(): Promise<SiteEvent[]> {
  const events = await fetchPublic<SiteEvent[]>('/events/upcoming');
  return withPreviewFallback(events, () => sampleEvents());
}

export async function getEventBySlug(slug: string): Promise<SiteEvent | null> {
  const event = await fetchPublic<SiteEvent>(`/events/${encodeURIComponent(slug)}`);
  if (event) return event;
  if (getSiteMode() === 'full') return null;
  return sampleEvents().find((e) => e.slug === slug) ?? null;
}
