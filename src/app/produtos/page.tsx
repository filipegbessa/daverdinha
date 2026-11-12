import type { Metadata } from 'next';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { EventsSection } from '@/features/site/components/EventsSection';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { Location } from '@/features/site/components/Location';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductCard } from '@/features/site/components/ProductCard';
import { isSample } from '@/features/site/data/samples';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';
import { paginate } from '@/features/site/lib/pagination';
import { pageMetadata } from '@/features/site/lib/seo';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Produtos · Daverdinha, ateliê de plantas no Rio de Janeiro',
    description:
      'Vasos, mudas, arranjos e kits do ateliê da Daverdinha no Santo Cristo, com entrega em bairros do Rio.',
    path: PRODUCTS_HREF,
  });
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const [{ page: pageParam }, categories, allProducts, events] = await Promise.all([
    searchParams,
    getActiveCategories(),
    getActiveProducts(),
    getUpcomingEvents(),
  ]);
  const { items: products, page, totalPages } = paginate(allProducts, pageParam);
  const { home, storeEnabled } = await shellProps();

  return (
    <SiteShell home={home} storeEnabled={storeEnabled} preview={allProducts.some(isSample) || events.some(isSample)}>
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
          <Pagination page={page} totalPages={totalPages} basePath={PRODUCTS_HREF} />
        </div>
      </section>

      <EventsSection events={events} cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
