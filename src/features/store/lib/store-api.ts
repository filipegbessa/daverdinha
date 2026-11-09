import type { CheckoutQuote, CreateCheckoutInput, CreateCheckoutResult } from '@/features/store/types/store';
import { isPreviewCart, previewQuote } from '@/features/store/lib/preview-quote';

/**
 * As chamadas da loja à API, como `public-api.ts` é pro catálogo. Rodam no
 * navegador (precisam do carrinho) e nunca lançam: falha de rede, API sem URL
 * ou resposta de erro viram `null`, e a tela decide o que mostrar.
 */
export async function quoteCart(
  items: { productId: string; quantity: number }[],
  cep?: string,
): Promise<CheckoutQuote | null> {
  // Prévia (`/site` com produtos de exemplo): cotação montada aqui mesmo.
  if (isPreviewCart(items)) return previewQuote(items, cep);
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

type CheckoutFailure = Extract<CreateCheckoutResult, { ok: false }>;

/** O que aparece ao finalizar uma compra de exemplo na prévia. */
export const PREVIEW_CHECKOUT =
  'Prévia: o pagamento ainda não está ligado. Na loja de verdade, aqui você iria pra página de pagamento.';

const PAYMENT_UNAVAILABLE = 'Não foi possível iniciar o pagamento. Tente de novo em instantes.';

/**
 * Cria o pedido e devolve pra onde mandar o cliente pagar. Nunca lança: a
 * tela decide pelo `status` (409 volta pro carrinho, 422 avisa na entrega,
 * o resto é "tente de novo").
 */
export async function createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  if (isPreviewCart(input.items)) {
    return { ok: false, status: 0, message: PREVIEW_CHECKOUT };
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { ok: false, status: 0, message: PAYMENT_UNAVAILABLE };

  try {
    const response = await fetch(`${apiUrl}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (response.ok) {
      return {
        ok: true,
        code: String(body.code),
        token: String(body.token),
        paymentUrl: String(body.paymentUrl),
      };
    }
    const known = response.status === 409 || response.status === 422;
    return {
      ok: false,
      status: response.status,
      message: known && typeof body.message === 'string' ? body.message : PAYMENT_UNAVAILABLE,
      ...(Array.isArray(body.problems) && { problems: body.problems as CheckoutQuote['problems'] }),
      ...(typeof body.reason === 'string' && { reason: body.reason as CheckoutFailure['reason'] }),
    };
  } catch {
    return { ok: false, status: 0, message: PAYMENT_UNAVAILABLE };
  }
}
