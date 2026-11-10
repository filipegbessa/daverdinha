import { formatDateTime } from '@/lib/format';
import type { FulfillmentStatus, SiteOrderAdmin, SiteOrderStatus } from '@/features/admin/types/admin';

/** Na ordem do filtro da lista; "Pagos" primeiro, que é o padrão. */
export const ORDER_STATUS_LABELS: Record<SiteOrderStatus, string> = {
  paid: 'Pagos',
  pending_payment: 'Aguardando pagamento',
  expired: 'Vencidos',
  cancelled: 'Cancelados',
  refunded: 'Estornados',
};

/** O status de um pedido só, no singular. */
export const ORDER_STATUS_SINGULAR: Record<SiteOrderStatus, string> = {
  paid: 'Pago',
  pending_payment: 'Aguardando pagamento',
  expired: 'Vencido',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
};

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  awaiting: 'Aguardando',
  preparing: 'Preparando',
  ready: 'Pronto / saiu pra entrega',
  completed: 'Concluído',
};

/** "Entrega · Catete" ou "Retirada". */
export function deliveryLabel(order: Pick<SiteOrderAdmin, 'deliveryMethod' | 'address'>): string {
  if (order.deliveryMethod === 'pickup') return 'Retirada';
  if (order.deliveryMethod === 'delivery') {
    return order.address?.bairro ? `Entrega · ${order.address.bairro}` : 'Entrega';
  }
  return 'Ingresso';
}

/** "09/11 14:32" no horário do Rio. */
export function formatOrderDate(iso: string): string {
  return formatDateTime(iso, { withYear: false });
}
