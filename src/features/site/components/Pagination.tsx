import { SiteButton, siteButtonClass } from '@/features/site/components/SiteButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** O lado sem página (primeira/última): mesmo formato do botão, apagado. */
const DISABLED = siteButtonClass({
  variant: 'secondary',
  size: 'sm',
  className: 'gap-1 cursor-default text-ink-soft opacity-40 hover:bg-transparent',
});

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
        <SiteButton href={hrefFor(page - 1)} variant="secondary" size="sm" className="gap-1 text-ink">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </SiteButton>
      ) : (
        <span aria-disabled="true" className={DISABLED}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </span>
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <SiteButton href={hrefFor(page + 1)} variant="secondary" size="sm" className="gap-1 text-ink">
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </SiteButton>
      ) : (
        <span aria-disabled="true" className={DISABLED}>
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
