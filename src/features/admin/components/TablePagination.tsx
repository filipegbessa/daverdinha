'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Prev/next arrows, the current position and the total, shared by every
 * paginated admin table.
 *
 * Renders nothing when everything fits on one page — a lone "Página 1 de 1"
 * is noise, not information.
 */
export function TablePagination({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  /** Plural noun for the total, e.g. "conversas". */
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-soft"
    >
      <span>
        {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-sand-line p-1.5 text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {/* aria-live so a screen reader announces the move; the arrows
            themselves give no feedback that anything changed. */}
        <span aria-live="polite">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-sand-line p-1.5 text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
