import { businessInfo } from '@/data/business';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';
import type { PublicSiteOrder, SiteOrderStatus } from '@/features/store/types/store';

/** O token da página de exemplo: `/pedido/exemplo?status=paid`. */
export const PREVIEW_ORDER_TOKEN = 'exemplo';

const STATUSES: SiteOrderStatus[] = ['pending_payment', 'paid', 'expired', 'cancelled', 'refunded'];

/**
 * Um pedido de exemplo pra cliente validar a página do pedido na prévia, em
 * cada estado. Só existe antes do lançamento (quem decide é a página).
 */
export function previewOrder(status?: string, delivery = true): PublicSiteOrder {
  const [vaso, , , , arranjo] = SAMPLE_PRODUCTS;
  const lines = [
    { product: vaso, quantity: 1 },
    { product: arranjo, quantity: 1 },
  ];
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const deliveryFee = delivery ? 15 : 0;
  const now = Date.now();
  const chosen = STATUSES.find((s) => s === status) ?? 'paid';

  return {
    code: 'DV-0001',
    kind: 'products',
    status: chosen,
    fulfillmentStatus: chosen === 'paid' ? 'preparing' : 'awaiting',
    items: lines.map(({ product, quantity }) => ({
      name: product.name,
      slug: product.slug,
      unitPrice: product.price,
      quantity,
      imageUrl: product.images[0] ?? null,
      leadTimeDays: product.availability === 'made_to_order' ? product.leadTimeDays : null,
    })),
    event: null,
    tickets: [],
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryMethod: delivery ? 'delivery' : 'pickup',
    bairro: delivery ? 'Santo Cristo' : null,
    pickup: delivery
      ? null
      : { address: businessInfo.address.formatted, hours: 'Seg a sex, 10h às 18h (exemplo)', instructions: null },
    paymentUrl: chosen === 'pending_payment' ? '#pagamento-de-exemplo' : null,
    expiresAt: new Date(now + 45 * 60 * 1000).toISOString(),
    createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
  };
}
