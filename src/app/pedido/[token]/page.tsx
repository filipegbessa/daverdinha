import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { OrderStatus } from '@/features/store/components/OrderStatus';
import { OrderNotFound } from '@/features/store/components/OrderNotFound';
import { PurchaseTracker } from '@/features/store/components/PurchaseTracker';
import { getOrderByToken } from '@/features/store/lib/store-api';
import { getActiveProductBySlug } from '@/features/site/lib/public-api';
import type { BuyAgainItem } from '@/features/store/components/BuyAgainButton';
import type { PublicSiteOrder } from '@/features/store/types/store';

/** Por pedido e muda com o pagamento: sem cache. */
export const dynamic = 'force-dynamic';

/** O link é privado de quem comprou: nunca no Google, e sem seguir links daqui. */
export const metadata: Metadata = {
  title: 'Seu pedido · Daverdinha',
  robots: { index: false, follow: false },
};

/**
 * Os itens do pedido que ainda estão à venda, com o produto como está hoje,
 * pro "Comprar de novo". Só em pedido de produtos pago ou vencido, com a loja
 * ligada. Produto que saiu do catálogo ou esgotou conta em `missing`.
 */
async function buyAgainItems(
  order: PublicSiteOrder,
  storeEnabled: boolean,
): Promise<{ items: BuyAgainItem[]; missing: number } | undefined> {
  if (!storeEnabled || order.kind !== 'products') return undefined;
  if (order.status !== 'paid' && order.status !== 'expired') return undefined;
  const found = await Promise.all(
    order.items.map(async (item) => {
      const product = item.slug ? await getActiveProductBySlug(item.slug) : null;
      return product && product.availability !== 'sold_out' ? { product, quantity: item.quantity } : null;
    }),
  );
  const items = found.filter((item): item is BuyAgainItem => item !== null);
  return { items, missing: order.items.length - items.length };
}

type Props = {
  params: Promise<{ token: string }>;
};

export default async function OrderPage({ params }: Props) {
  const shell = await shellProps();
  const { token } = await params;

  const order = await getOrderByToken(token);
  const reloadHref = `/pedido/${encodeURIComponent(token)}`;

  // A API não respondeu: o pedido pode existir, então nada de 404.
  if (order === 'unavailable') {
    return (
      <SiteShell {...shell}>
        <section className="px-6 py-10 md:py-14">
          <OrderNotFound reason="unavailable" retryHref={reloadHref} />
        </section>
      </SiteShell>
    );
  }
  // Pedido de produto só com a loja ligada. Ingresso não depende dela (a
  // venda de ingressos tem o próprio interruptor), e pedido já feito continua
  // com a página no ar mesmo se a venda for desligada depois. O 404 mostra
  // `not-found.tsx`, com o caminho pra pedir os links de novo.
  if (!order || (order.kind === 'products' && !shell.storeEnabled)) notFound();

  const buyAgain = await buyAgainItems(order, shell.storeEnabled);

  return (
    <SiteShell {...shell}>
      <PurchaseTracker order={order} />
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <OrderStatus order={order} reloadHref={reloadHref} buyAgain={buyAgain} />
        </div>
      </section>
    </SiteShell>
  );
}
