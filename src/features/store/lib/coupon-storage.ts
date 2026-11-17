/**
 * O cupom que veio num link (`?cupom=CODIGO`, divulgado no Instagram ou no
 * WhatsApp), guardado no navegador até o checkout, onde ele já vem aplicado.
 * Sai depois que um pedido é criado.
 */
export const COUPON_STORAGE_KEY = 'daverdinha:coupon';

/** Lê o `?cupom=` da URL atual e guarda; devolve o código guardado (novo ou de antes). */
export function captureCouponFromUrl(search: string): void {
  const code = new URLSearchParams(search).get('cupom')?.trim().toUpperCase();
  if (!code) return;
  try {
    localStorage.setItem(COUPON_STORAGE_KEY, code.slice(0, 30));
  } catch {
    // Sem armazenamento, o cupom só não vem preenchido no checkout.
  }
}

export function readSavedCoupon(): string {
  try {
    return localStorage.getItem(COUPON_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveCoupon(code: string): void {
  try {
    if (code) localStorage.setItem(COUPON_STORAGE_KEY, code);
    else localStorage.removeItem(COUPON_STORAGE_KEY);
  } catch {
    // Nada a fazer.
  }
}
