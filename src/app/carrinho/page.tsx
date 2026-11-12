import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { CartView } from '@/features/store/components/CartView';

/** Página de cada visitante: nunca no Google nem no sitemap. */
export const metadata: Metadata = {
  title: 'Carrinho · Daverdinha',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const shell = await shellProps();
  if (!shell.storeEnabled) notFound();

  return (
    <SiteShell {...shell}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl">Carrinho</h1>
          <div className="mt-8">
            <CartView />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
