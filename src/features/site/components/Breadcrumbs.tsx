import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { breadcrumbJsonLd, type Crumb } from '@/features/site/lib/structured-data';
import { JsonLd } from '@/features/site/components/JsonLd';

/** A trilha visível e a mesma trilha em dados estruturados, das mesmas fontes — as duas não têm como divergir. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <nav aria-label="Você está em" className="text-sm text-ink-soft">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className="hover:text-moss hover:underline">
                      {crumb.name}
                    </Link>
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
