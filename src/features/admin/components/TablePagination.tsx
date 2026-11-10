'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  isBusy = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  /** Plural noun for the total, e.g. "conversas". */
  itemLabel: string;
  onPageChange: (page: number) => void;
  /** The next page is loading: arrows lock and the position says so. */
  isBusy?: boolean;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação"
      aria-busy={isBusy}
      className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground"
    >
      <span>
        {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={isBusy || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        {/* aria-live so a screen reader announces the move; the arrows
            themselves give no feedback that anything changed. */}
        <span aria-live="polite">{isBusy ? 'Carregando...' : `Página ${page} de ${totalPages}`}</span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Próxima página"
          disabled={isBusy || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
