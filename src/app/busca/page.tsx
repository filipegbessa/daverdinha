import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CatalogControls } from '@/features/site/components/CatalogControls';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductCard } from '@/features/site/components/ProductCard';
import { SEARCH_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts } from '@/features/site/lib/public-api';
import { isOnSale } from '@/features/site/lib/sale';
import { paginate } from '@/features/site/lib/pagination';
import {
  applyCatalogParams,
  catalogQuery,
  parseCatalogParams,
  searchProducts,
  type CatalogSearchParams,
} from '@/features/site/lib/catalog-list';

// Página de resultado de busca não entra no Google (conteúdo raso e infinito).
export const metadata: Metadata = {
  title: 'Busca · Daverdinha',
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<CatalogSearchParams> };

/**
 * `/busca?q=`: a busca do cabeçalho. Acha pelo nome, pela categoria e pela
 * descrição, sem ligar pra acento; o "Enter" da caixa do cabeçalho cai aqui.
 */
export default async function SearchPage({ searchParams }: Props) {
  const [query, categories, allProducts] = await Promise.all([
    searchParams,
    getActiveCategories(),
    getActiveProducts(),
  ]);
  const params = parseCatalogParams(query);
  const found = params.q ? searchProducts(allProducts, params.q) : [];
  const listed = applyCatalogParams(found, params);
  const { items: products, page, totalPages } = paginate(listed, params.page);
  const { home, storeEnabled, storePause } = await shellProps();

  return (
    <SiteShell home={home} storeEnabled={storeEnabled} storePause={storePause}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Busca', path: SEARCH_HREF },
            ]}
          />
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">
            {params.q ? `Resultados para “${params.q}”` : 'Buscar produtos'}
          </h1>
          <form action={SEARCH_HREF} method="get" role="search" className="mt-6 flex max-w-xl gap-2">
            <label htmlFor="busca-q" className="sr-only">
              Buscar produtos
            </label>
            <input
              id="busca-q"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Vaso, costela-de-adão, kit..."
              maxLength={100}
              className="min-w-0 flex-1 rounded-full border border-moss-line bg-paper px-4 py-2 text-ink placeholder:text-ink-soft/70 focus-visible:outline-2 focus-visible:outline-moss"
            />
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss/90"
            >
              <Search className="size-4" aria-hidden="true" />
              Buscar
            </button>
          </form>

          {params.q && found.length > 0 && (
            <CatalogControls
              action={SEARCH_HREF}
              q={params.q}
              sort={params.sort}
              filter={params.filter}
              total={listed.length}
            />
          )}

          {params.q && products.length === 0 && (
            <div className="mt-10 space-y-4 text-ink-soft">
              <p>
                {found.length === 0
                  ? 'Não achamos nada com essa busca. Tente outra palavra ou veja as categorias:'
                  : 'Nenhum resultado com esse filtro.'}
              </p>
              {found.length === 0 && <CategoryChips categories={categories} showSale={allProducts.some(isOnSale)} />}
            </div>
          )}

          {products.length > 0 && (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} totalPages={totalPages} basePath={SEARCH_HREF} query={catalogQuery(params)} />
        </div>
      </section>
    </SiteShell>
  );
}
