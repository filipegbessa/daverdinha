import { businessInfo } from '@/data/business';
import { isSample, SAMPLE_PRODUCTS } from '@/features/site/data/samples';
import type { CheckoutQuote } from '@/features/store/types/store';

/** Valor de entrega da prévia, igual pra qualquer CEP. */
export const PREVIEW_DELIVERY_FEE = 15;

/** Mesmo padrão de parcelamento da API (`StoreSettings`): até 3x, parcela mínima de R$ 30. */
const PREVIEW_INSTALLMENTS = { max: 3, minValue: 30 };

export function isPreviewCart(items: { productId: string }[]): boolean {
  return items.length > 0 && items.every((item) => isSample({ id: item.productId }));
}

/**
 * Uma cotação de mentira pros produtos de exemplo de `/site`, montada no
 * navegador, pra cliente validar carrinho e checkout antes de a loja existir.
 * A API não conhece os ids `sample-…`; nada aqui chega a ela.
 */
export function previewQuote(items: { productId: string; quantity: number }[], cep?: string): CheckoutQuote {
  const lines = items.flatMap(({ productId, quantity }) => {
    const product = SAMPLE_PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];
    return [
      {
        productId,
        name: product.name,
        slug: product.slug,
        unitPrice: product.price,
        quantity,
        lineTotal: Math.round(product.price * quantity * 100) / 100,
        imageUrl: product.images[0] ?? null,
        availability: product.availability === 'made_to_order' ? ('made_to_order' as const) : ('in_stock' as const),
        leadTimeDays: product.availability === 'made_to_order' ? product.leadTimeDays : null,
      },
    ];
  });
  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const byValue = Math.floor(subtotal / PREVIEW_INSTALLMENTS.minValue);

  return {
    items: lines,
    subtotal,
    installments: Math.max(1, Math.min(PREVIEW_INSTALLMENTS.max, byValue)),
    pickup: {
      available: true,
      address: businessInfo.address.formatted,
      hours: 'Seg a sex, 10h às 18h (exemplo)',
      instructions: null,
    },
    delivery: cep
      ? { available: true, fee: PREVIEW_DELIVERY_FEE, bairro: 'seu bairro (exemplo)', area: 'Exemplo' }
      : { available: false, reason: 'no_cep' },
    problems: items
      .filter(({ productId }) => {
        const product = SAMPLE_PRODUCTS.find((p) => p.id === productId);
        return !product || product.availability === 'sold_out';
      })
      .map(({ productId }) => ({ productId, reason: 'insufficient_stock' as const, available: 0 })),
  };
}
