import { getSiteMode } from '@/lib/site-mode';
import { SAMPLE_HERO_SLIDES } from '@/features/site/data/samples';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';
import type { Product, ProductCategory } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import type { HeroSlide } from '@/features/site/types/hero-slide';

/**
 * Leitura das rotas públicas da API pro site. Lista vazia é vazia, antes e
 * depois do lançamento: os produtos e eventos de exemplo saíram em
 * 2026-11-18 (só os destaques do topo ainda têm exemplo, ver `getHeroSlides`).
 * Mesmo contrato de
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

export async function getActiveCategories(): Promise<ProductCategory[]> {
  const categories = await fetchPublic<ProductCategory[]>('/product-categories/active');
  return categories ?? [];
}

export async function getActiveProducts(categorySlug?: string): Promise<Product[]> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  const products = await fetchPublic<Product[]>(`/products/active${query}`);
  return products ?? [];
}

/**
 * Os produtos marcados como destaque no admin: a vitrine da home, as listas
 * das páginas internas e, filtrado por categoria, os "mais vendidos" na
 * página de um produto.
 */
export async function getFeaturedProducts(categorySlug?: string): Promise<Product[]> {
  const query = categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : '';
  const products = await fetchPublic<Product[]>(`/products/active?featured=true${query}`);
  return products ?? [];
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
  return fetchPublic<Product>(`/products/active/${encodeURIComponent(slug)}`);
}

export async function getUpcomingEvents(): Promise<SiteEvent[]> {
  const events = await fetchPublic<SiteEvent[]>('/events/upcoming');
  return events ?? [];
}

export async function getEventBySlug(slug: string): Promise<SiteEvent | null> {
  return fetchPublic<SiteEvent>(`/events/${encodeURIComponent(slug)}`);
}
