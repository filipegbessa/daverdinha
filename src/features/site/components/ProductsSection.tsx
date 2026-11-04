import Link from 'next/link';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ProductCard } from '@/features/site/components/ProductCard';
import type { Product, ProductCategory } from '@/features/site/types/catalog';

const HOME_LIMIT = 4;

/** A vitrine da home: categorias e os primeiros produtos, com o caminho pro catálogo completo. */
export function ProductsSection({ categories, products }: { categories: ProductCategory[]; products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section id="produtos" className="scroll-mt-24 bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Catálogo</Eyebrow>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Produtos</h2>
          </div>
          <Link href={PRODUCTS_HREF} className="text-sm font-semibold text-moss underline underline-offset-4">
            Ver todos os produtos
          </Link>
        </div>
        <div className="mt-6">
          <CategoryChips categories={categories} />
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {products.slice(0, HOME_LIMIT).map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
