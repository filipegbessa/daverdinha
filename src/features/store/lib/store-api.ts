import type {
  CheckoutQuote,
  CreateCheckoutInput,
  CreateCheckoutResult,
  CreateTicketCheckoutInput,
  CreateTicketCheckoutResult,
  PublicSiteOrder,
  TicketCheckoutFailureReason,
  TicketQuote,
} from '@/features/store/types/store';

/**
 * As chamadas da loja à API, como `public-api.ts` é pro catálogo. Rodam no
 * navegador (precisam do carrinho) e nunca lançam: falha de rede, API sem URL
 * ou resposta de erro viram `null`, e a tela decide o que mostrar.
 */
export async function quoteCart(
  items: { productId: string; quantity: number }[],
  cep?: string,
  couponCode?: string,
): Promise<CheckoutQuote | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || items.length === 0) return null;

  try {
    const response = await fetch(`${apiUrl}/checkout/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, ...(cep && { cep }), ...(couponCode && { couponCode }) }),
    });
    if (!response.ok) return null;
    return (await response.json()) as CheckoutQuote;
  } catch {
    return null;
  }
}

type CheckoutFailure = Extract<CreateCheckoutResult, { ok: false }>;

const PAYMENT_UNAVAILABLE = 'Não foi possível iniciar o pagamento. Tente de novo em instantes.';

/** Falhas cuja mensagem da API vai pra tela (o resto vira "tente de novo"); 429 = muitas compras do mesmo IP. */
const KNOWN_FAILURES = new Set([409, 422, 429]);

/**
 * Cria o pedido e devolve pra onde mandar o cliente pagar. Nunca lança: a
 * tela decide pelo `status` (409 volta pro carrinho, 422 avisa na entrega,
 * 429 mostra a mensagem da API, o resto é "tente de novo").
 */
export async function createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
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
    const known = KNOWN_FAILURES.has(response.status);
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
 * formulário; o resto é "tente de novo".
 */
export async function createTicketCheckout(input: CreateTicketCheckoutInput): Promise<CreateTicketCheckoutResult> {
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
    // 409: venda fechada ou vagas; 422: o cupom deixou de valer; 429: muitas tentativas.
    const known = KNOWN_FAILURES.has(response.status);
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

/** O total da compra de ingresso com o cupom. Falha: `null`. */
export async function quoteTickets(eventId: string, quantity: number, couponCode: string): Promise<TicketQuote | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl}/checkout/tickets/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, quantity, couponCode }),
    });
    if (!response.ok) return null;
    return (await response.json()) as TicketQuote;
  } catch {
    return null;
  }
}

/**
 * O pedido pelo token do link, lido no servidor e sem cache (o status muda
 * com o pagamento). `null` só quando a API diz que não existe (404): a página
 * responde 404. Falha de rede, erro da API ou API sem URL é `'unavailable'`,
 * pra página não dizer "não encontrado" de um pedido que existe.
 */
export async function getOrderByToken(token: string): Promise<PublicSiteOrder | null | 'unavailable'> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return 'unavailable';
  try {
    const response = await fetch(`${apiUrl}/checkout/orders/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (response.status === 404) return null;
    if (!response.ok) return 'unavailable';
    return (await response.json()) as PublicSiteOrder;
  } catch {
    return 'unavailable';
  }
}

/** Resultado de "Meus pedidos": a API nunca diz se o e-mail tem pedido. */
export type OrderLinksResult = { ok: true } | { ok: false; reason: 'too_many' | 'error' };

/**
 * Pede os links dos pedidos por e-mail (`POST /checkout/orders/lookup`). A
 * API responde 202 com ou sem pedido; 429 é limite de tentativas.
 */
export async function requestOrderLinks(email: string): Promise<OrderLinksResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { ok: false, reason: 'error' };
  try {
    const response = await fetch(`${apiUrl}/checkout/orders/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (response.ok) return { ok: true };
    return { ok: false, reason: response.status === 429 ? 'too_many' : 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
