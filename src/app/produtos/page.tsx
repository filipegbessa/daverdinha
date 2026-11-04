import type { Metadata } from 'next';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ProductCard } from '@/features/site/components/ProductCard';
import { isSample } from '@/features/site/data/samples';
import { homeHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts } from '@/features/site/lib/public-api';
import { pageMetadata } from '@/features/site/lib/seo';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Produtos · Daverdinha, ateliê de plantas no Rio de Janeiro',
    description: 'Vasos, mudas, arranjos e kits do ateliê da Daverdinha no Santo Cristo, com entrega em bairros do Rio.',
    path: PRODUCTS_HREF,
  });
}

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([getActiveCategories(), getActiveProducts()]);
  const home = homeHref();

  return (
    <SiteShell home={home} preview={products.some(isSample)}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Produtos', path: PRODUCTS_HREF },
            ]}
          />
          <Eyebrow>Catálogo</Eyebrow>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">Produtos</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Tudo feito ou escolhido no ateliê. Pra pedir, abra o produto e fale com a gente pelo WhatsApp.
          </p>
          <div className="mt-6">
            <CategoryChips categories={categories} />
          </div>
          {products.length === 0 ? (
            <p className="mt-10 text-ink-soft">Nenhum produto no catálogo agora. Chama a gente no WhatsApp!</p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
