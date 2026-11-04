import Link from 'next/link';
import { cn } from '@/lib/utils';
import { categoryHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import type { ProductCategory } from '@/features/site/types/catalog';

/**
 * No celular as tags ficam numa linha só, que desliza de lado — quebradas em
 * várias linhas, elas empurravam os produtos pra baixo da tela.
 */
export const CHIP_ROW =
  '-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden';

export function chipClass(current: boolean): string {
  return cn(
    'inline-block shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors',
    current ? 'border-moss bg-moss text-paper' : 'border-moss-line bg-paper text-ink hover:border-moss hover:text-moss',
  );
}

/**
 * Filtro de categoria das páginas do catálogo, feito de links de verdade:
 * o Google segue link, não clique, e é assim que ele descobre as páginas de
 * categoria. (Na home, as tags filtram na própria página — ver
 * `ProductsSection`.)
 */
export function CategoryChips({ categories, active }: { categories: ProductCategory[]; active?: string }) {
  const chips: { href: string; label: string; slug?: string }[] = [
    { href: PRODUCTS_HREF, label: 'Todos' },
    ...categories.map((c) => ({ href: categoryHref(c.slug), label: c.name, slug: c.slug })),
  ];

  return (
    <nav aria-label="Categorias">
      <ul className={CHIP_ROW}>
        {chips.map((chip) => {
          const current = chip.slug === active;
          return (
            <li key={chip.href}>
              <Link href={chip.href} aria-current={current ? 'page' : undefined} className={chipClass(current)}>
                {chip.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
