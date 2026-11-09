'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CART_STORAGE_KEY,
  MAX_CART_ITEMS,
  clampQuantity,
  readCart,
  writeCart,
  type CartItem,
} from '@/features/store/lib/cart-storage';
import type { Product } from '@/features/site/types/catalog';
import type { CheckoutQuote } from '@/features/store/types/store';

interface CartContextValue {
  items: CartItem[];
  /** Soma das quantidades: o número do ícone do carrinho. */
  count: number;
  /** `false` até ler o `localStorage`: antes disso o carrinho não é "vazio", é desconhecido. */
  ready: boolean;
  /** Soma ao que já está no carrinho. `false` se o carrinho já tem o máximo de itens diferentes. */
  add: (product: Product, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Atualiza nome e preço com os da cotação; itens com problema ficam, o cliente decide. */
  syncFromQuote: (quote: CheckoutQuote) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * O carrinho do site, guardado no navegador. Montado no `SiteShell` só com a
 * loja ligada. Lê o armazenamento depois de montar (o HTML do servidor não
 * tem carrinho) e acompanha mudanças feitas em outra aba.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) setItems(readCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const result = next(prev);
      writeCart(result);
      return result;
    });
  }, []);

  const add = useCallback(
    (product: Product, quantity = 1) => {
      const current = readCart();
      const exists = current.some((i) => i.productId === product.id);
      if (!exists && current.length >= MAX_CART_ITEMS) return false;
      update((prev) => {
        const found = prev.find((i) => i.productId === product.id);
        if (found) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: clampQuantity(i.quantity + quantity) } : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            categorySlug: product.category.slug,
            name: product.name,
            price: product.price,
            imageUrl: product.images[0] ?? null,
            quantity: clampQuantity(quantity),
          },
        ];
      });
      return true;
    },
    [update],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      update((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(quantity) } : i)),
      ),
    [update],
  );

  const remove = useCallback(
    (productId: string) => update((prev) => prev.filter((i) => i.productId !== productId)),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const syncFromQuote = useCallback(
    (quote: CheckoutQuote) =>
      update((prev) =>
        prev.map((item) => {
          const line = quote.items.find((l) => l.productId === item.productId);
          return line ? { ...item, name: line.name, price: line.unitPrice, imageUrl: line.imageUrl } : item;
        }),
      ),
    [update],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      syncFromQuote,
    }),
    [items, ready, add, setQuantity, remove, clear, syncFromQuote],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart precisa do <CartProvider> (loja ligada).');
  return context;
}
