import { getSiteMode } from '@/lib/site-mode';
import type { Product } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * Onde fica a home do site completo. Com o site desligado no Dashboard, `/` é
 * a landing "em breve", e a home completa que a cliente valida vive em
 * `/site` — o logo e o "Início" da trilha precisam levar pra lá, não pra uma
 * página que não tem nada do que ela está revisando. Server-only.
 */
export async function homeHref(): Promise<string> {
  return (await getSiteMode()) === 'full' ? '/' : '/site';
}

export const PRODUCTS_HREF = '/produtos';
export const AGENDA_HREF = '/agenda';

export function categoryHref(categorySlug: string): string {
  return `${PRODUCTS_HREF}/${categorySlug}`;
}

/**
 * Aninhada sob a categoria: o endereço conta onde o produto está e bate com a
 * trilha de navegação. Se o produto trocar de categoria, a página redireciona
 * a URL antiga (ver `app/produtos/[categoria]/[produto]/page.tsx`).
 */
export function productHref(product: Pick<Product, 'slug'> & { category: Pick<Product['category'], 'slug'> }): string {
  return `${categoryHref(product.category.slug)}/${product.slug}`;
}

export function eventHref(event: Pick<SiteEvent, 'slug'>): string {
  return `${AGENDA_HREF}/${event.slug}`;
}

/** URL absoluta, pra mensagem do WhatsApp e dados estruturados. Sem `SITE_URL`, fica relativa. */
export function absoluteUrl(path: string): string {
  const siteUrl = process.env.SITE_URL;
  return siteUrl ? `${siteUrl.replace(/\/$/, '')}${path}` : path;
}
