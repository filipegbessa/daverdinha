import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/features/site/components/SiteShell';
import { homeHref } from '@/features/site/lib/paths';
import { CheckoutForm } from '@/features/store/components/CheckoutForm';
import { isStoreEnabled } from '@/features/store/lib/store-enabled';

/** Página de cada visitante: nunca no Google nem no sitemap. */
export const metadata: Metadata = {
  title: 'Finalizar compra · Daverdinha',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  if (!isStoreEnabled()) notFound();

  return (
    <SiteShell home={homeHref()}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl">Finalizar compra</h1>
          <div className="mt-8">
            <CheckoutForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
