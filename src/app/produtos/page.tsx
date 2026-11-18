import type { Metadata } from 'next';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { EventsSection } from '@/features/site/components/EventsSection';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { Location } from '@/features/site/components/Location';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductCard } from '@/features/site/components/ProductCard';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';
import { paginate } from '@/features/site/lib/pagination';
import { CatalogControls } from '@/features/site/components/CatalogControls';
import {
  applyCatalogParams,
  catalogQuery,
  parseCatalogParams,
  type CatalogSearchParams,
} from '@/features/site/lib/catalog-list';
import { pageMetadata } from '@/features/site/lib/seo';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Loja · Daverdinha, ateliê de plantas no Rio de Janeiro',
    description:
      'Vasos, mudas, arranjos e kits do ateliê da Daverdinha no Santo Cristo, com entrega em bairros do Rio.',
    path: PRODUCTS_HREF,
  });
}

type Props = { searchParams: Promise<CatalogSearchParams> };

export default async function ProductsPage({ searchParams }: Props) {
  const [query, categories, allProducts, events] = await Promise.all([
    searchParams,
    getActiveCategories(),
    getActiveProducts(),
    getUpcomingEvents(),
  ]);
  const params = parseCatalogParams(query);
  const listed = applyCatalogParams(allProducts, params);
  const { items: products, page, totalPages } = paginate(listed, params.page);
  const { home, storeEnabled, storePause } = await shellProps();

  return (
    <SiteShell home={home} storeEnabled={storeEnabled} storePause={storePause}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Loja', path: PRODUCTS_HREF },
            ]}
          />
          <Eyebrow>Catálogo</Eyebrow>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">Loja</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Tudo feito ou escolhido no ateliê. Pra pedir, abra o produto e fale com a gente pelo WhatsApp.
          </p>
          <div className="mt-6">
            <CategoryChips categories={categories} />
          </div>
          {allProducts.length > 0 && (
            <CatalogControls action={PRODUCTS_HREF} sort={params.sort} filter={params.filter} total={listed.length} />
          )}
          {products.length === 0 ? (
            <p className="mt-10 text-ink-soft">
              {allProducts.length === 0
                ? 'Nenhum produto no catálogo agora. Chama a gente no WhatsApp!'
                : 'Nenhum produto com esse filtro agora.'}
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} totalPages={totalPages} basePath={PRODUCTS_HREF} query={catalogQuery(params)} />
        </div>
      </section>

      <EventsSection events={events} cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
