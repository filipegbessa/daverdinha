import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { EventsSection } from '@/features/site/components/EventsSection';
import { Location } from '@/features/site/components/Location';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductCard } from '@/features/site/components/ProductCard';
import { isSample } from '@/features/site/data/samples';
import { categoryHref, homeHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';
import { paginate } from '@/features/site/lib/pagination';
import { pageMetadata } from '@/features/site/lib/seo';

type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<{ page?: string }> };

async function findCategory(slug: string) {
  const categories = await getActiveCategories();
  return { categories, category: categories.find((c) => c.slug === slug) };
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
 * indexada.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const [{ categories, category }, allProducts, { page: pageParam }, events] = await Promise.all([
    findCategory(categoria),
    getActiveProducts(categoria),
    searchParams,
    getUpcomingEvents(),
  ]);
  if (!category || allProducts.length === 0) notFound();

  const { items: products, page, totalPages } = paginate(allProducts, pageParam);
  const home = homeHref();

  return (
    <SiteShell home={home} preview={allProducts.some(isSample) || events.some(isSample)}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Produtos', path: PRODUCTS_HREF },
              { name: category.name, path: categoryHref(category.slug) },
            ]}
          />
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">{category.name}</h1>
          {category.description && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{category.description}</p>}
          <div className="mt-6">
            <CategoryChips categories={categories} active={category.slug} />
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} basePath={categoryHref(category.slug)} />
        </div>
      </section>

      <EventsSection events={events} cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
