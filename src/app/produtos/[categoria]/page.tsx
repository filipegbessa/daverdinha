import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { EventsSection } from '@/features/site/components/EventsSection';
import { Location } from '@/features/site/components/Location';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductCard } from '@/features/site/components/ProductCard';
import { categoryHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
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
import { isOnSale, SALE_CATEGORY } from '@/features/site/lib/sale';
import type { Product } from '@/features/site/types/catalog';

type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<CatalogSearchParams> };

async function findCategory(slug: string) {
  const categories = await getActiveCategories();
  const category = slug === SALE_CATEGORY.slug ? SALE_CATEGORY : categories.find((c) => c.slug === slug);
  return { categories, category };
}

/**
 * Os produtos da página e se o chip "Promoção" aparece. Na "Promoção", são
 * os com desconto de todas as categorias.
 */
async function categoryProducts(slug: string): Promise<{ products: Product[]; showSale: boolean }> {
  const all = await getActiveProducts();
  const onSale = all.filter(isOnSale);
  if (slug === SALE_CATEGORY.slug) return { products: onSale, showSale: onSale.length > 0 };
  return { products: await getActiveProducts(slug), showSale: onSale.length > 0 };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const { category } = await findCategory(categoria);
  if (!category) return {};

  return pageMetadata({
    title: `${category.name} · Daverdinha, Santo Cristo RJ`,
    description: category.description || `${category.name} do ateliê da Daverdinha, com entrega em bairros do Rio.`,
    path: categoryHref(category.slug),
  });
}

/**
 * Uma página por categoria, pra disputar buscas amplas ("vasos de cerâmica
 * Rio"). O texto de abertura vem do admin: uma página só com grade de cards é
 * fraca pra ranquear. Categoria sem produto ativo é 404, não página vazia
 * indexada; a "Promoção" sem produto com desconto também.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const [{ categories, category }, { products: allProducts, showSale }, query, events] = await Promise.all([
    findCategory(categoria),
    categoryProducts(categoria),
    searchParams,
    getUpcomingEvents(),
  ]);
  if (!category || allProducts.length === 0) notFound();

  const listParams = parseCatalogParams(query);
  const listed = applyCatalogParams(allProducts, listParams);
  const { items: products, page, totalPages } = paginate(listed, listParams.page);
  const { home, storeEnabled, storePause } = await shellProps();

  return (
    <SiteShell home={home} storeEnabled={storeEnabled} storePause={storePause}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Loja', path: PRODUCTS_HREF },
              { name: category.name, path: categoryHref(category.slug) },
            ]}
          />
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">{category.name}</h1>
          {category.description && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{category.description}</p>}
          <div className="mt-6">
            <CategoryChips categories={categories} active={category.slug} showSale={showSale} />
          </div>
          <CatalogControls
            action={categoryHref(category.slug)}
            sort={listParams.sort}
            filter={listParams.filter}
            total={listed.length}
          />
          {products.length === 0 ? (
            <p className="mt-10 text-ink-soft">
              Nenhum produto {category === SALE_CATEGORY ? 'em promoção' : 'desta categoria'} com esse filtro agora.
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
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={categoryHref(category.slug)}
            query={catalogQuery(listParams)}
          />
        </div>
      </section>

      <EventsSection events={events} cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
