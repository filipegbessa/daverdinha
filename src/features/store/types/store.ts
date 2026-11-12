/**
 * Contratos da loja, iguais aos da API (ver "Contratos" em
 * `daverdinha-api/docs/plans/2026-11-05-loja-online-v1.md`).
 */

export type QuoteProblemReason = 'not_found' | 'inactive' | 'insufficient_stock';

export type DeliveryUnavailableReason = 'no_cep' | 'unresolved' | 'not_covered' | 'no_area';

/** `POST /checkout/quote`: preço, estoque e frete do carrinho, calculados no servidor. */
export interface CheckoutQuote {
  items: {
    productId: string;
    name: string;
    slug: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl: string | null;
    availability: 'in_stock' | 'made_to_order';
    leadTimeDays: number | null;
  }[];
  subtotal: number;
  /** Parcelas sem juros sobre o subtotal (1 = só à vista). */
  installments: number;
  pickup: { available: true; address: string; hours: string; instructions: string | null } | { available: false };
  delivery:
    | { available: true; fee: number; bairro: string; area: string }
    | { available: false; reason: DeliveryUnavailableReason; bairro?: string };
  problems: { productId: string; reason: QuoteProblemReason; available?: number }[];
}

/** Corpo de `POST /checkout`. Itens só com id e quantidade: preço e frete são do servidor. */
export interface CreateCheckoutInput {
  items: { productId: string; quantity: number }[];
  customer: { name: string; email: string; phone: string };
  deliveryMethod: 'pickup' | 'delivery';
  address?: { cep: string; street: string; number: string; complement?: string };
  notes?: string;
}

export type CreateCheckoutResult =
  | { ok: true; code: string; token: string; paymentUrl: string }
  | {
      ok: false;
      /** 409 = estoque/produto mudou; 422 = entrega indisponível; 503 = pagamento fora; 0 = rede. */
      status: number;
      message: string;
      problems?: CheckoutQuote['problems'];
      reason?: DeliveryUnavailableReason | 'pickup_disabled';
    };

/** Corpo de `POST /checkout/tickets`: preço e vagas são do servidor. */
export interface CreateTicketCheckoutInput {
  eventId: string;
  attendees: { name: string }[];
  customer: { name: string; email: string; phone: string };
  notes?: string;
}

export type TicketCheckoutFailureReason = 'tickets_closed' | 'not_available' | 'sold_out' | 'too_many';

export type CreateTicketCheckoutResult =
  /** `paymentUrl: null` = inscrição gratuita, já confirmada. */
  | { ok: true; code: string; token: string; paymentUrl: string | null }
  | {
      ok: false;
      /** 409 = venda fechada, esgotado ou acima do limite; 503 = pagamento fora; 0 = rede. */
      status: number;
      message: string;
      reason?: TicketCheckoutFailureReason;
      spotsLeft?: number;
      max?: number;
    };

export type SiteOrderStatus = 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'refunded';
export type FulfillmentStatus = 'awaiting' | 'preparing' | 'ready' | 'completed';

/** `GET /checkout/orders/:token`: o pedido sem dados de contato nem rua. */
export interface PublicSiteOrder {
  code: string;
  kind: 'products' | 'tickets';
  status: SiteOrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: {
    name: string;
    slug: string | null;
    unitPrice: number;
    quantity: number;
    imageUrl: string | null;
    leadTimeDays: number | null;
  }[];
  /** Só em pedido de ingresso. */
  event: {
    title: string;
    slug: string;
    startsAt: string;
    endsAt: string | null;
    locationName: string | null;
    locationAddress: string | null;
  } | null;
  /** Um por participante; `[]` em pedido de produto. */
  tickets: { attendeeName: string; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: 'pickup' | 'delivery' | null;
  bairro: string | null;
  pickup: { address: string; hours: string; instructions: string | null } | null;
  paymentUrl: string | null;
  expiresAt: string;
  createdAt: string;
}
