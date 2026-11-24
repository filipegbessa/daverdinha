import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';
import { toSitePath } from '@/features/site/lib/paths';
import type { Product, ProductCategory } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import type { HeroSlide } from '@/features/site/types/hero-slide';
import type { AboutContent } from '@/features/site/types/about';

/**
 * Leitura das rotas públicas da API pro site. Lista vazia é vazia, antes e
 * depois do lançamento: o site não tem mais dados de exemplo. Mesmo contrato de
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
 * Nunca vazio: sem slide no ar (ou com a API fora), a home mostra o slide
 * padrão, e com um slide só não há slideshow. Link do botão pro próprio site
 * vira caminho (`/agenda`), pra abrir na mesma aba; o slideshow roda no
 * navegador, onde `SITE_URL` não existe, então isso é resolvido aqui.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const slides = await fetchPublic<HeroSlide[]>('/hero-slides/active');
  if (!slides || slides.length === 0) return [DEFAULT_HERO_SLIDE];
  return slides.map((slide) => (slide.linkUrl ? { ...slide, linkUrl: toSitePath(slide.linkUrl) } : slide));
}

/** O "Sobre" salvo no admin; `null` (nunca salvo ou API fora) = o texto do código. */
export async function getAbout(): Promise<AboutContent | null> {
  const about = await fetchPublic<AboutContent>('/site-content/about');
  return about?.configured ? about : null;
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
