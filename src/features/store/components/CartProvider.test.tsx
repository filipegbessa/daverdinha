import { act, render, renderHook, screen } from '@testing-library/react';
import { CartProvider, useCart } from './CartProvider';
import { CART_STORAGE_KEY, readCart } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';
import type { Product } from '@/features/site/types/catalog';
import type { CheckoutQuote } from '@/features/store/types/store';

const vaso: Product = { ...SAMPLE_PRODUCTS[0], id: 'p1' };
const muda: Product = { ...SAMPLE_PRODUCTS[2], id: 'p2' };

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

describe('CartProvider', () => {
  beforeEach(() => localStorage.clear());

  it('is ready only after reading what was saved', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'p1', slug: 's', categorySlug: 'c', name: 'Vaso', price: 10, imageUrl: null, quantity: 2 }]),
    );

    const { result } = renderCart();

    expect(result.current.ready).toBe(true);
    expect(result.current.count).toBe(2);
  });

  it('adds up the same product and saves it', () => {
    const { result } = renderCart();

    act(() => {
      result.current.add(vaso);
      result.current.add(vaso, 2);
      result.current.add(muda);
    });

    expect(result.current.items.map((i) => [i.productId, i.quantity])).toEqual([
      ['p1', 3],
      ['p2', 1],
    ]);
    expect(result.current.items[0]).toEqual(
      expect.objectContaining({ slug: vaso.slug, categorySlug: 'vasos', price: vaso.price }),
    );
    expect(readCart()).toHaveLength(2);
  });

  it('removes an item when its quantity goes to zero', () => {
    const { result } = renderCart();
    act(() => {
      result.current.add(vaso);
    });

    act(() => result.current.setQuantity('p1', 0));

    expect(result.current.items).toEqual([]);
  });

  it('takes name and price from the quote, keeping items that have problems', () => {
    const { result } = renderCart();
    act(() => {
      result.current.add(vaso);
      result.current.add(muda);
    });
    const quote = {
      items: [{ productId: 'p1', name: 'Vaso M novo', unitPrice: 99, imageUrl: null }],
      problems: [{ productId: 'p2', reason: 'inactive' }],
    } as unknown as CheckoutQuote;

    act(() => result.current.syncFromQuote(quote));

    expect(result.current.items.map((i) => [i.productId, i.name, i.price])).toEqual([
      ['p1', 'Vaso M novo', 99],
      ['p2', muda.name, muda.price],
    ]);
  });

  it('follows changes made in another tab', () => {
    const { result } = renderCart();
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'p9', slug: 's', categorySlug: 'c', name: 'X', price: 1, imageUrl: null, quantity: 4 }]),
    );

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));
    });

    expect(result.current.count).toBe(4);
  });

  it('refuses a 31st different product', () => {
    const { result } = renderCart();
    act(() => {
      for (let i = 0; i < 30; i++) result.current.add({ ...vaso, id: `x${i}` });
    });

    let added = true;
    act(() => {
      added = result.current.add(muda);
    });

    expect(added).toBe(false);
    expect(result.current.items).toHaveLength(30);
  });

  it('says what is missing when used without the provider', () => {
    const Broken = () => {
      useCart();
      return null;
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow(/CartProvider/);
    expect(screen.queryByText('x')).toBeNull();
  });
});
