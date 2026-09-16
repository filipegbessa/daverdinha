'use client';
import { useEffect, useState } from 'react';

interface UsePaginationResult {
  page: number;
  setPage: (page: number) => void;
}

/**
 * Page state that survives the two ways a page number goes stale:
 *
 * - the filters changed, so page 4 of the old result set is meaningless —
 *   `resetKey` sends it back to page 1;
 * - the page stopped existing (the last category on page 7 was deleted), so
 *   it falls back to the last page there is rather than showing nothing.
 */
export function usePagination(resetKey: string, totalPages: number | undefined): UsePaginationResult {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (totalPages !== undefined && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return { page, setPage };
}
