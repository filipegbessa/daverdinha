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
/** Busca do catálogo (`?q=`); as sugestões do cabeçalho vêm de `/busca/sugestoes`. */
export const SEARCH_HREF = '/busca';
/** Pede os links dos pedidos por e-mail (sem conta). */
export const MY_ORDERS_HREF = '/meus-pedidos';
/** Políticas da loja: o checkout pede pra ler a de trocas. */
export const RETURNS_HREF = '/trocas-e-devolucoes';
export const DELIVERY_INFO_HREF = '/entrega-e-retirada';

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

/** O host sem `www.`, pra `daverdinha.com.br` e `www.daverdinha.com.br` valerem o mesmo. */
function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

/**
 * Link cadastrado no admin (o botão de um destaque) em caminho do site, se ele
 * for do site: `/agenda` fica igual, e uma URL completa do próprio domínio
 * (`https://www.daverdinha.com.br/agenda`) vira `/agenda`, pra navegar na mesma
 * aba. Link pra fora do site volta como veio. Server-only (lê `SITE_URL`).
 */
export function toSitePath(url: string): string {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !/^https?:\/\//i.test(url)) return url;
  try {
    const target = new URL(url);
    if (bareHost(target.host) !== bareHost(new URL(siteUrl).host)) return url;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return url;
  }
}

/** Caminho dentro do site (`/agenda`), e não `//outro-site.com`, que o navegador trata como externo. */
export function isSitePath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
