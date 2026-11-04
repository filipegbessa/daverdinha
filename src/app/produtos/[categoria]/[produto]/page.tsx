import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { CepChecker } from '@/features/site/components/CepChecker';
import { ContactLink } from '@/features/site/components/ContactLink';
import { JsonLd } from '@/features/site/components/JsonLd';
import { ProductCard } from '@/features/site/components/ProductCard';
import { ProductGallery } from '@/features/site/components/ProductGallery';
import { isSample } from '@/features/site/data/samples';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { formatPrice } from '@/features/site/lib/format';
import { categoryHref, homeHref, PRODUCTS_HREF, productHref } from '@/features/site/lib/paths';
import { getActiveProductBySlug, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';
import { pageMetadata } from '@/features/site/lib/seo';
import { productJsonLd } from '@/features/site/lib/structured-data';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { orderMessage } from '@/features/site/lib/whatsapp-messages';

type Props = { params: Promise<{ categoria: string; produto: string }> };

const RELATED_LIMIT = 4;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { produto } = await params;
  const product = await getActiveProductBySlug(produto);
  if (!product) return {};

  return pageMetadata({
    title: `${product.name} · ${formatPrice(product.price)} · Daverdinha`,
    description: product.description.slice(0, 160),
    path: productHref(product),
    image: product.images[0],
  });
}

export default async function ProductPage({ params }: Props) {
  const { categoria, produto } = await params;
  const product = await getActiveProductBySlug(produto);
  if (!product) notFound();

  // O produto é achado só pelo slug, que é único. Se ele mudou de categoria
  // depois que a URL antiga foi indexada ou compartilhada, a URL antiga
  // redireciona (308) em vez de virar 404 — e não perde a posição no Google.
  if (product.category.slug !== categoria) permanentRedirect(productHref(product));

  const [siblings, events, zones] = await Promise.all([
    getActiveProducts(product.category.slug),
    getUpcomingEvents(),
    getCoveredDeliveryZones(),
  ]);
  const related = siblings.filter((p) => p.id !== product.id).slice(0, RELATED_LIMIT);
  const home = homeHref();

  return (
    <SiteShell home={home} events={events} showPreviewNotice={isSample(product)}>
      <JsonLd data={productJsonLd(product)} />
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Produtos', path: PRODUCTS_HREF },
              { name: product.category.name, path: categoryHref(product.category.slug) },
              { name: product.name, path: productHref(product) },
            ]}
          />
          <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
            <ProductGallery images={product.images} name={product.name} />
            <div>
              <Link
                href={categoryHref(product.category.slug)}
                className="text-xs font-semibold tracking-[0.2em] text-berry uppercase hover:underline"
              >
                {product.category.name}
              </Link>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-balance text-ink md:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 text-2xl font-semibold text-moss tabular-nums">{formatPrice(product.price)}</p>
              <p className="mt-5 leading-relaxed whitespace-pre-line text-ink-soft">{product.description}</p>
              <ContactLink
                href={getWhatsAppUrl(orderMessage(product))}
                channel="whatsapp"
                location="product"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3.5 font-semibold text-paper shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft sm:w-auto"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Pedir pelo WhatsApp
              </ContactLink>

              {zones.length > 0 && (
                <div className="mt-10 rounded-2xl border border-sand-line bg-sand/60 p-5">
                  <h2 className="font-serif text-lg font-semibold text-ink">Entregamos no seu bairro?</h2>
                  <div className="mt-3">
                    <CepChecker zones={zones} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-sand px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-serif text-2xl font-semibold text-ink">Mais {product.category.name.toLowerCase()}</h2>
              <Link
                href={categoryHref(product.category.slug)}
                className="text-sm font-semibold text-moss underline underline-offset-4"
              >
                Ver todos
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
