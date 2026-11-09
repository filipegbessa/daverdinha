import { CART_STORAGE_KEY, readCart, writeCart, type CartItem } from './cart-storage';

const item: CartItem = {
  productId: 'p1',
  slug: 'vaso-m',
  categorySlug: 'vasos',
  name: 'Vaso M',
  price: 89.9,
  imageUrl: null,
  quantity: 2,
};

describe('cart storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the cart', () => {
    writeCart([item]);
    expect(readCart()).toEqual([item]);
  });

  it('treats invalid JSON, another shape or items without a product id as an empty cart', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{nope');
    expect(readCart()).toEqual([]);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [item] }));
    expect(readCart()).toEqual([]);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ...item, productId: '' }, item]));
    expect(readCart()).toEqual([item]);
  });

  it('keeps quantities between 1 and 20 and at most 30 items', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { ...item, quantity: 99 },
        { ...item, productId: 'p2', quantity: 0 },
        ...Array.from({ length: 40 }, (_, i) => ({ ...item, productId: `x${i}` })),
      ]),
    );

    const cart = readCart();
    expect(cart).toHaveLength(30);
    expect(cart[0].quantity).toBe(20);
    expect(cart[1].quantity).toBe(1);
  });

  it('does not break when storage throws (private Safari)', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as unknown as Storage;

    expect(readCart(broken)).toEqual([]);
    expect(() => writeCart([item], broken)).not.toThrow();
  });
});
