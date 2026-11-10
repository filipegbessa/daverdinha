import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Anterior/próxima por link (sem JS), igual ao resto do site público. Some
 * sozinha quando cabe tudo numa página.
 */
export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-6 text-sm text-ink">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="flex items-center gap-1 rounded-full border border-moss-line px-3 py-1.5 font-semibold hover:bg-moss/10"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 text-ink-soft opacity-40">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </span>
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="flex items-center gap-1 rounded-full border border-moss-line px-3 py-1.5 font-semibold hover:bg-moss/10"
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 text-ink-soft opacity-40">
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
