import Link from 'next/link';
import { cn } from '@/lib/utils';
import { categoryHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import type { ProductCategory } from '@/features/site/types/catalog';

/**
 * Filtro de categoria feito de links de verdade, não de botões em
 * JavaScript: o Google segue link, não clique, e é assim que ele descobre as
 * páginas de categoria.
 */
export function CategoryChips({ categories, active }: { categories: ProductCategory[]; active?: string }) {
  const chips: { href: string; label: string; slug?: string }[] = [
    { href: PRODUCTS_HREF, label: 'Todos' },
    ...categories.map((c) => ({ href: categoryHref(c.slug), label: c.name, slug: c.slug })),
  ];

  return (
    <nav aria-label="Categorias">
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const current = chip.slug === active;
          return (
            <li key={chip.href}>
              <Link
                href={chip.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'inline-block rounded-full border px-4 py-1.5 text-sm transition-colors',
                  current
                    ? 'border-moss bg-moss text-paper'
                    : 'border-moss-line bg-paper text-ink hover:border-moss hover:text-moss',
                )}
              >
                {chip.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
