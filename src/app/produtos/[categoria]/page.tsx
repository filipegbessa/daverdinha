import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CategoryChips } from '@/features/site/components/CategoryChips';
import { ContactLink } from '@/features/site/components/ContactLink';
import { ProductCard } from '@/features/site/components/ProductCard';
import { isSample } from '@/features/site/data/samples';
import { categoryHref, homeHref, PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts } from '@/features/site/lib/public-api';
import { pageMetadata } from '@/features/site/lib/seo';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

type Props = { params: Promise<{ categoria: string }> };

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
export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const [{ categories, category }, products] = await Promise.all([
    findCategory(categoria),
    getActiveProducts(categoria),
  ]);
  if (!category || products.length === 0) notFound();

  const home = homeHref();

  return (
    <SiteShell home={home} preview={products.some(isSample)}>
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
        </div>
      </section>

      <section className="bg-sand px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="font-serif text-xl text-ink">Não achou o que queria? A gente faz sob encomenda.</p>
          <ContactLink
            href={getWhatsAppUrl(`Oi! Queria ver ${category.name.toLowerCase()} sob encomenda 🌱`)}
            channel="whatsapp"
            location="category"
            className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 font-semibold text-paper shadow-card hover:bg-moss/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </ContactLink>
        </div>
      </section>
    </SiteShell>
  );
}
