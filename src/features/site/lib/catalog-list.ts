import type { Product } from '@/features/site/types/catalog';

/**
 * Busca, ordenação e filtro das listas do catálogo. Tudo no servidor, sobre a
 * lista que o site já busca da API (e guarda por 60 s): o catálogo de um
 * ateliê cabe numa página de resposta, e assim a busca ignora acento ("adao"
 * acha "Adão") sem extensão no Postgres. Se o catálogo crescer muito, isso
 * vira parâmetro da API sem mudar quem chama.
 */

export type CatalogSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';
export type CatalogFilter = 'all' | 'in_stock' | 'made_to_order';

export const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'relevance', label: 'Destaques' },
  { value: 'newest', label: 'Novidades' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
];

export const FILTER_OPTIONS: { value: CatalogFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'in_stock', label: 'Pronta entrega' },
  { value: 'made_to_order', label: 'Sob encomenda' },
];

export interface CatalogParams {
  q: string;
  sort: CatalogSort;
  filter: CatalogFilter;
  page?: string;
}

export interface CatalogSearchParams {
  q?: string;
  ordem?: string;
  tipo?: string;
  page?: string;
}

function oneOf<T extends string>(value: string | undefined, options: { value: T }[], fallback: T): T {
  return options.find((o) => o.value === value)?.value ?? fallback;
}

/** Lê a URL (`?q=&ordem=&tipo=&page=`); valor desconhecido vira o padrão. */
export function parseCatalogParams(params: CatalogSearchParams): CatalogParams {
  return {
    q: (params.q ?? '').trim().slice(0, 100),
    sort: oneOf(params.ordem, SORT_OPTIONS, 'relevance'),
    filter: oneOf(params.tipo, FILTER_OPTIONS, 'all'),
    page: params.page,
  };
}

/** Os parâmetros que a paginação repete, sem os que estão no padrão. */
export function catalogQuery(params: Pick<CatalogParams, 'q' | 'sort' | 'filter'>): Record<string, string> {
  return {
    ...(params.q && { q: params.q }),
    ...(params.sort !== 'relevance' && { ordem: params.sort }),
    ...(params.filter !== 'all' && { tipo: params.filter }),
  };
}

/** Minúsculas, sem acento, hífen vira espaço: "Costela-de-Adão" → "costela de adao". */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Todas as palavras precisam aparecer no nome, na categoria ou na descrição.
 * Quem tem tudo no nome vem antes, e depois quem tem no nome ou na
 * categoria; o resto mantém a ordem do catálogo.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];

  const scored = products.flatMap((product, index) => {
    const name = normalizeSearch(product.name);
    const title = `${name} ${normalizeSearch(product.category.name)}`;
    const all = `${title} ${normalizeSearch(product.description)}`;
    if (!words.every((w) => all.includes(w))) return [];
    const score = words.every((w) => name.includes(w)) ? 0 : words.every((w) => title.includes(w)) ? 1 : 2;
    return [{ product, score, index }];
  });
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.product);
}

/**
 * "Destaques" é a ordem do admin (ou a da busca), intocada. Nas outras, o
 * esgotado vai pro fim: a compradora vê primeiro o que pode levar.
 */
export function sortProducts(products: Product[], sort: CatalogSort): Product[] {
  if (sort === 'relevance') return products;
  const soldOutLast = (a: Product, b: Product) =>
    Number(a.availability === 'sold_out') - Number(b.availability === 'sold_out');
  const by: Record<CatalogSort, (a: Product, b: Product) => number> = {
    relevance: () => 0, // não chega aqui
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    newest: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  };
  // `sort` do JS é estável: o empate mantém a ordem do catálogo.
  return [...products].sort((a, b) => soldOutLast(a, b) || by[sort](a, b));
}

export function filterProducts(products: Product[], filter: CatalogFilter): Product[] {
  return filter === 'all' ? products : products.filter((p) => p.availability === filter);
}

/** Filtro, depois ordem: o que as páginas de lista aplicam antes de paginar. */
export function applyCatalogParams(products: Product[], params: Pick<CatalogParams, 'sort' | 'filter'>): Product[] {
  return sortProducts(filterProducts(products, params.filter), params.sort);
}
