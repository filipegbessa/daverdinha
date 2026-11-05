'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { usePagination } from '@/features/admin/lib/use-pagination';
import type { Paginated } from '@/features/admin/types/admin';

/**
 * Everything a paginated admin list needs, in one call: the page state
 * (back to page 1 when `filters` change, back to the last page when the
 * current one stops existing), the request with `?page=` and the filters
 * built in, and the envelope. Pair it with `<TablePagination {...pagination} />`
 * and `<BusyRegion busy={isRefreshing}>` around the list.
 *
 * Every page used to wire `usePagination` + a `totalPages` state + an effect
 * copying it from the response + the query string by hand.
 */
export function usePaginatedResource<T, E extends Paginated<T> = Paginated<T>>(
  basePath: string,
  filters: Record<string, string | undefined> = {},
  options?: { pollIntervalMs?: number },
) {
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const filterKey = JSON.stringify(filters);
  const { page, setPage } = usePagination(filterKey, totalPages);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(JSON.parse(filterKey) as Record<string, string | undefined>)) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ''}`;
  }, [basePath, filterKey, page]);

  const resource = useApiResource<E>(path, options);
  const { data } = resource;

  useEffect(() => {
    if (data) setTotalPages(data.totalPages);
  }, [data]);

  return {
    ...resource,
    items: data?.items ?? [],
    /** Spread into `<TablePagination>` (plus `itemLabel`); `null` until the first page arrives. */
    pagination: data
      ? {
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
          onPageChange: setPage,
          isBusy: resource.isRefreshing,
        }
      : null,
  };
}
