import type {
  CheckoutQuote,
  CreateCheckoutInput,
  CreateCheckoutResult,
  CreateTicketCheckoutInput,
  CreateTicketCheckoutResult,
  PublicSiteOrder,
  TicketCheckoutFailureReason,
} from '@/features/store/types/store';
import { isPreviewCart, previewQuote } from '@/features/store/lib/preview-quote';
import { isSample } from '@/features/site/data/samples';

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

/**
 * Compra de ingresso (ou inscrição gratuita) direto da página do evento, sem
 * carrinho. Nunca lança: 409 traz o `reason` e os números pra tela ajustar o
 * formulário; o resto é "tente de novo". Evento de exemplo da prévia não
 * chega à API.
 */
export async function createTicketCheckout(input: CreateTicketCheckoutInput): Promise<CreateTicketCheckoutResult> {
  if (isSample({ id: input.eventId })) {
    return { ok: false, status: 0, message: PREVIEW_CHECKOUT };
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { ok: false, status: 0, message: PAYMENT_UNAVAILABLE };

  try {
    const response = await fetch(`${apiUrl}/checkout/tickets`, {
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
        paymentUrl: typeof body.paymentUrl === 'string' ? body.paymentUrl : null,
      };
    }
    const known = response.status === 409;
    return {
      ok: false,
      status: response.status,
      message: known && typeof body.message === 'string' ? body.message : PAYMENT_UNAVAILABLE,
      ...(typeof body.reason === 'string' && { reason: body.reason as TicketCheckoutFailureReason }),
      ...(typeof body.spotsLeft === 'number' && { spotsLeft: body.spotsLeft }),
      ...(typeof body.max === 'number' && { max: body.max }),
    };
  } catch {
    return { ok: false, status: 0, message: PAYMENT_UNAVAILABLE };
  }
}

/**
 * O pedido pelo token do link, lido no servidor e sem cache (o status muda
 * com o pagamento). Não existe, falha ou API sem URL: `null`, e a página
 * responde 404.
 */
export async function getOrderByToken(token: string): Promise<PublicSiteOrder | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl}/checkout/orders/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as PublicSiteOrder;
  } catch {
    return null;
  }
}
