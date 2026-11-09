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
