import type { CheckoutQuote } from '@/features/store/types/store';

/**
 * As chamadas da loja à API, como `public-api.ts` é pro catálogo. Rodam no
 * navegador (precisam do carrinho) e nunca lançam: falha de rede, API sem URL
 * ou resposta de erro viram `null`, e a tela decide o que mostrar.
 */
export async function quoteCart(
  items: { productId: string; quantity: number }[],
  cep?: string,
): Promise<CheckoutQuote | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || items.length === 0) return null;

  try {
    const response = await fetch(`${apiUrl}/checkout/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, ...(cep && { cep }) }),
    });
    if (!response.ok) return null;
    return (await response.json()) as CheckoutQuote;
  } catch {
    return null;
  }
}
