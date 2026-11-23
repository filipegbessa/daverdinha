import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import Link from 'next/link';
import { CheckoutForm } from '@/features/store/components/CheckoutForm';
import { siteButtonClass } from '@/features/site/components/SiteButton';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { pauseText } from '@/features/store/lib/store-pause';

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
            {/* Loja em pausa: nem chega ao formulário (a API recusaria o pedido). */}
            {shell.storePause ? (
              <div className="max-w-xl space-y-5">
                <p className="text-ink">{pauseText(shell.storePause)}</p>
                <p className="text-ink-soft">Os itens do seu carrinho ficam guardados para quando a loja voltar.</p>
                <Link href={PRODUCTS_HREF} className={siteButtonClass({ variant: 'secondary' })}>
                  Ver os produtos
                </Link>
              </div>
            ) : (
              <CheckoutForm />
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
