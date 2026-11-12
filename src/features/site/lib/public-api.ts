import { getSiteMode } from '@/lib/site-mode';
import {
  SAMPLE_CATEGORIES,
  SAMPLE_FEATURED_PRODUCTS,
  SAMPLE_HERO_SLIDES,
  SAMPLE_PRODUCTS,
  sampleEvents,
} from '@/features/site/data/samples';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';
import type { Product, ProductCategory } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import type { HeroSlide } from '@/features/site/types/hero-slide';

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
async function withPreviewFallback<T>(items: T[] | null, samples: () => T[]): Promise<T[]> {
  if (items && items.length > 0) return items;
  return (await getSiteMode()) === 'full' ? [] : samples();
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

/**
 * Os produtos marcados como destaque no admin: a vitrine da home, as listas
 * das páginas internas e, filtrado por categoria, os "mais vendidos" na
 * página de um produto.
 */
export async function getFeaturedProducts(categorySlug?: string): Promise<Product[]> {
  const query = categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : '';
  const products = await fetchPublic<Product[]>(`/products/active?featured=true${query}`);
  return withPreviewFallback(products, () =>
    categorySlug ? SAMPLE_FEATURED_PRODUCTS.filter((p) => p.category.slug === categorySlug) : SAMPLE_FEATURED_PRODUCTS,
  );
}

/**
 * Nunca vazio: sem slide cadastrado (ou com a rota ainda inexistente na API),
 * a home mostra o slide padrão, e com um slide só não há slideshow.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const slides = await fetchPublic<HeroSlide[]>('/hero-slides/active');
  if (slides && slides.length > 0) return slides;
  return (await getSiteMode()) === 'full' ? [DEFAULT_HERO_SLIDE] : SAMPLE_HERO_SLIDES;
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const product = await fetchPublic<Product>(`/products/active/${encodeURIComponent(slug)}`);
  if (product) return product;
  if ((await getSiteMode()) === 'full') return null;
  return SAMPLE_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getUpcomingEvents(): Promise<SiteEvent[]> {
  const events = await fetchPublic<SiteEvent[]>('/events/upcoming');
  return withPreviewFallback(events, () => sampleEvents());
}

export async function getEventBySlug(slug: string): Promise<SiteEvent | null> {
  const event = await fetchPublic<SiteEvent>(`/events/${encodeURIComponent(slug)}`);
  if (event) return event;
  if ((await getSiteMode()) === 'full') return null;
  return sampleEvents().find((e) => e.slug === slug) ?? null;
}
