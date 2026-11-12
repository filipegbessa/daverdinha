import type { Metadata } from 'next';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { OrderLookupForm } from '@/features/store/components/OrderLookupForm';

/** Não tem o que achar no Google, e o formulário é de cada comprador. */
export const metadata: Metadata = {
  title: 'Meus pedidos · Daverdinha',
  robots: { index: false, follow: false },
};

/**
 * Sem conta nem senha: quem perdeu o link do pedido ou do ingresso recebe
 * todos de novo no e-mail. No ar mesmo com a loja de produtos desligada,
 * porque os ingressos não dependem dela.
 */
export default async function MyOrdersPage() {
  const shell = await shellProps();

  return (
    <SiteShell {...shell}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-xl">
          <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl">Meus pedidos</h1>
          <p className="mt-3 text-ink-soft">
            Perdeu o link de um pedido ou dos seus ingressos? Digite o e-mail usado na compra e mandamos todos de novo.
          </p>
          <div className="mt-8">
            <OrderLookupForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
