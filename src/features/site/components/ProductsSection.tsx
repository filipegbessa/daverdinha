'use client';

import { useState } from 'react';
import Link from 'next/link';
import { categoryHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import { Carousel } from '@/features/site/components/Carousel';
import { CHIP_ROW, chipClass } from '@/features/site/components/CategoryChips';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ProductCard } from '@/features/site/components/ProductCard';
import type { Product } from '@/features/site/types/catalog';

/**
 * A vitrine da home: os produtos marcados como destaque no admin. As tags
 * filtram aqui mesmo, sem trocar de página. Só aparecem as categorias que
 * têm produto em destaque, pra nenhuma tag dar numa vitrine vazia.
 *
 * O link "Ver todos" acompanha o filtro e leva pra página da categoria — é
 * por ele que o Google continua achando as páginas de categoria a partir da
 * home, já que as tags aqui são botões.
 */
export function ProductsSection({
  products,
  cardVariant = 'full',
}: {
  products: Product[];
  cardVariant?: 'full' | 'compact';
}) {
  const [active, setActive] = useState<string | null>(null);
  if (products.length === 0) return null;

  const categories = [...new Map(products.map((p) => [p.category.slug, p.category])).values()];
  const visible = active ? products.filter((p) => p.category.slug === active) : products;
  const activeCategory = categories.find((c) => c.slug === active);

  return (
    <section id="produtos" className="scroll-mt-24 bg-sand px-6 py-14 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <Eyebrow>Catálogo</Eyebrow>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Produtos em destaque</h2>
          </div>
          <Link
            href={activeCategory ? categoryHref(activeCategory.slug) : PRODUCTS_HREF}
            className="text-sm font-semibold text-moss underline underline-offset-4"
          >
            {activeCategory ? `Ver todos de ${activeCategory.name}` : 'Ver todos os produtos'}
          </Link>
        </div>

        {categories.length > 1 && (
          <div role="group" aria-label="Filtrar por categoria" className={`mt-6 ${CHIP_ROW}`}>
            <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={chipClass(active === null)}>
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-pressed={active === c.slug}
                onClick={() => setActive(c.slug)}
                className={chipClass(active === c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {/* A key reinicia o carrossel no começo a cada troca de filtro. */}
          <Carousel key={active ?? 'todos'} label="Produtos em destaque">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} variant={cardVariant} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
