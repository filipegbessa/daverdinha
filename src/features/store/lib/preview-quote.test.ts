import { isPreviewCart, previewQuote, PREVIEW_DELIVERY_FEE } from './preview-quote';
import { createCheckout, quoteCart, PREVIEW_CHECKOUT } from './store-api';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';

const [vaso] = SAMPLE_PRODUCTS; // pronta entrega, R$ 89,90
const kit = SAMPLE_PRODUCTS.find((p) => p.availability === 'made_to_order')!;
const soldOut = SAMPLE_PRODUCTS.find((p) => p.availability === 'sold_out')!;

describe('preview quote', () => {
  it('only applies to carts made entirely of samples', () => {
    expect(isPreviewCart([{ productId: vaso.id }])).toBe(true);
    expect(isPreviewCart([{ productId: vaso.id }, { productId: 'real-id' }])).toBe(false);
    expect(isPreviewCart([])).toBe(false);
  });

  it('prices samples, shows their lead time and a sample delivery once there is a CEP', () => {
    const quote = previewQuote(
      [
        { productId: vaso.id, quantity: 2 },
        { productId: kit.id, quantity: 1 },
      ],
      '22220000',
    );

    expect(quote.items[0]).toEqual(expect.objectContaining({ lineTotal: 179.8, availability: 'in_stock' }));
    expect(quote.items[1]).toEqual(
      expect.objectContaining({ availability: 'made_to_order', leadTimeDays: kit.leadTimeDays }),
    );
    expect(quote.subtotal).toBe(Math.round((179.8 + kit.price) * 100) / 100);
    expect(quote.installments).toBe(3);
    expect(quote.delivery).toEqual(expect.objectContaining({ available: true, fee: PREVIEW_DELIVERY_FEE }));
    expect(quote.pickup).toEqual(expect.objectContaining({ available: true }));
  });

  it('flags a sold-out sample like the real API would', () => {
    expect(previewQuote([{ productId: soldOut.id, quantity: 1 }]).problems).toEqual([
      { productId: soldOut.id, reason: 'insufficient_stock', available: 0 },
    ]);
  });

  it('never reaches the API: quotes locally and stops checkout with a preview message', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(quoteCart([{ productId: vaso.id, quantity: 1 }])).resolves.toEqual(
      expect.objectContaining({ subtotal: vaso.price }),
    );
    await expect(
      createCheckout({
        items: [{ productId: vaso.id, quantity: 1 }],
        customer: { name: 'Maria', email: 'm@exemplo.com', phone: '21999998888' },
        deliveryMethod: 'pickup',
      }),
    ).resolves.toEqual({ ok: false, status: 0, message: PREVIEW_CHECKOUT });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
