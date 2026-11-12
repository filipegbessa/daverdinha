import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { CheckoutForm } from '@/features/store/components/CheckoutForm';

/** Página de cada visitante: nunca no Google nem no sitemap. */
export const metadata: Metadata = {
  title: 'Finalizar compra · Daverdinha',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const shell = await shellProps();
  if (!shell.storeEnabled) notFound();

  return (
    <SiteShell {...shell}>
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
