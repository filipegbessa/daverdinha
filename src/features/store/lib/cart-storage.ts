/**
 * O carrinho guardado no navegador. Ele só serve pra desenhar a tela: preço,
 * estoque e frete que valem são os da cotação (`POST /checkout/quote`), que a
 * página do carrinho pede sempre antes de mostrar o total.
 */

export const CART_STORAGE_KEY = 'daverdinha:cart:v1';
export const MAX_CART_ITEMS = 30;
export const MAX_ITEM_QUANTITY = 20;

export interface CartItem {
  productId: string;
  slug: string;
  categorySlug: string;
  name: string;
  /** O preço da última vez que o site viu; o que vale é o da cotação. */
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity)));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    item.productId !== '' &&
    typeof item.slug === 'string' &&
    typeof item.categorySlug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    (item.imageUrl === null || typeof item.imageUrl === 'string') &&
    typeof item.quantity === 'number'
  );
}

/**
 * Lê o carrinho tolerando tudo: JSON inválido, outra versão, item sem
 * `productId` ou um `localStorage` que lança (Safari em aba privada) viram
 * carrinho vazio, nunca tela quebrada.
 */
export function readCart(storage: Storage | undefined = globalThis.localStorage): CartItem[] {
  try {
    const raw = storage?.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCartItem)
      .slice(0, MAX_CART_ITEMS)
      .map((item) => ({ ...item, quantity: clampQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

/** Grava sem lançar: sem armazenamento, o carrinho só não sobrevive ao F5. */
export function writeCart(items: CartItem[], storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Cota cheia ou armazenamento bloqueado: segue só em memória.
  }
}
