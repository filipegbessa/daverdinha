import type { SiteOrderAdmin } from '@/features/admin/types/admin';

/** Um pedido pago com entrega, pros testes das telas de pedido. */
export const order: SiteOrderAdmin = {
  id: 'o1',
  code: 'DV-0042',
  kind: 'products',
  status: 'paid',
  fulfillmentStatus: 'preparing',
  customer: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '5521999998888' },
  deliveryMethod: 'delivery',
  address: {
    cep: '22220000',
    street: 'Rua do Catete',
    number: '100',
    complement: 'apto 2',
    bairro: 'Catete',
    zone: 'Zona Sul',
    area: 'Perto',
  },
  notes: 'Deixar na portaria',
  items: [
    {
      productId: 'p1',
      name: 'Vaso M',
      slug: 'vaso-m',
      unitPrice: 89.9,
      quantity: 1,
      imageUrl: null,
      leadTimeDays: 10,
    },
  ],
  subtotal: 89.9,
  deliveryFee: 15,
  total: 104.9,
  payment: { linkId: null, orderId: null, chargeId: 'ch_1', status: 'paid' },
  paymentUrl: null,
  paidAt: '2026-11-09T15:05:00Z',
  expiresAt: '2026-11-09T16:00:00Z',
  createdAt: '2026-11-09T15:00:00Z',
};
