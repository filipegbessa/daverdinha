'use client';

import type { ChangeEvent, FormEvent } from 'react';
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  catalogQuery,
  parseCatalogParams,
  type CatalogFilter,
  type CatalogSort,
} from '@/features/site/lib/catalog-list';

const SELECT =
  'cursor-pointer rounded-full border border-moss-line bg-paper py-1.5 pr-8 pl-3 text-sm text-ink hover:border-moss focus-visible:outline-2 focus-visible:outline-moss';

/**
 * Ordenar e filtrar uma lista do catálogo. É um formulário GET de verdade
 * (a URL guarda a escolha, e o "voltar" do navegador funciona); com JS,
 * envia sozinho ao trocar a opção, sem o botão. Trocar a ordem volta pra
 * página 1, porque o `page` não vai junto.
 */
export function CatalogControls({
  action,
  q,
  sort,
  filter,
  total,
}: {
  action: string;
  q?: string;
  sort: CatalogSort;
  filter: CatalogFilter;
  total: number;
}) {
  const submit = (e: ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  // Com JS, a URL leva só o que saiu do padrão (`?tipo=in_stock`, não
  // `?tipo=all&ordem=relevance`), como os links da paginação.
  const navigate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = parseCatalogParams({
      q: q,
      tipo: String(data.get('tipo') ?? ''),
      ordem: String(data.get('ordem') ?? ''),
    });
    const query = new URLSearchParams(catalogQuery(params)).toString();
    window.location.assign(query ? `${action}?${query}` : action);
  };

  return (
    <form
      action={action}
      method="get"
      onSubmit={navigate}
      role="search"
      aria-label="Ordenar e filtrar"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-ink-soft" aria-live="polite">
        {total === 1 ? '1 produto' : `${total} produtos`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {q && <input type="hidden" name="q" value={q} />}
        <label className="sr-only" htmlFor="catalog-tipo">
          Mostrar
        </label>
        <select id="catalog-tipo" name="tipo" defaultValue={filter} onChange={submit} className={SELECT}>
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === 'all' ? 'Todos os produtos' : o.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="catalog-ordem">
          Ordenar por
        </label>
        <select id="catalog-ordem" name="ordem" defaultValue={sort} onChange={submit} className={SELECT}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <noscript>
          <button type="submit" className="rounded-full border border-moss px-3 py-1.5 text-sm text-moss">
            Aplicar
          </button>
        </noscript>
      </div>
    </form>
  );
}
