import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteMode } from '@/lib/site-mode';
import { SiteShell } from '@/features/site/components/SiteShell';
import { homeHref } from '@/features/site/lib/paths';
import { OrderStatus } from '@/features/store/components/OrderStatus';
import { PurchaseTracker } from '@/features/store/components/PurchaseTracker';
import { isStoreEnabled } from '@/features/store/lib/store-enabled';
import { getOrderByToken } from '@/features/store/lib/store-api';
import { PREVIEW_ORDER_TOKEN, previewOrder } from '@/features/store/lib/preview-order';

/** Por pedido e muda com o pagamento: sem cache. */
export const dynamic = 'force-dynamic';

/** O link é privado de quem comprou: nunca no Google, e sem seguir links daqui. */
export const metadata: Metadata = {
  title: 'Seu pedido · Daverdinha',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string; entrega?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  if (!isStoreEnabled()) notFound();
  const { token } = await params;

  // Antes do lançamento, `/pedido/exemplo?status=paid` mostra um pedido de
  // exemplo em cada estado, pra cliente validar a página.
  const preview = token === PREVIEW_ORDER_TOKEN && getSiteMode() !== 'full';
  const query = await searchParams;
  const order = preview ? previewOrder(query.status, query.entrega !== 'retirada') : await getOrderByToken(token);
  if (!order) notFound();

  return (
    <SiteShell home={homeHref()} preview={preview}>
      {!preview && <PurchaseTracker order={order} />}
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <OrderStatus order={order} reloadHref={`/pedido/${encodeURIComponent(token)}`} />
        </div>
      </section>
    </SiteShell>
  );
}
