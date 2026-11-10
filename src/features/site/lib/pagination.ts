/**
 * Paginação das listas públicas (produtos, categoria, agenda). Puramente no
 * servidor, sobre a lista já buscada — ainda não tem endpoint paginado na
 * API pública, então isso é um corte client-side do array inteiro até existir.
 */
const PER_PAGE = 20;

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginate<T>(items: T[], pageParam: string | undefined): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) ? Math.min(Math.max(1, Math.trunc(requested)), totalPages) : 1;
  const start = (page - 1) * PER_PAGE;
  return { items: items.slice(start, start + PER_PAGE), page, totalPages };
}
