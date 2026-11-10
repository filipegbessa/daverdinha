/**
 * Formatação de dinheiro e data do site, da loja e do admin — uma fórmula só,
 * pra o preço do card, o da página de produto e o do pedido no admin nunca
 * divergirem.
 */

// A loja é no Rio; o servidor da Vercel roda em UTC. Sem o fuso explícito,
// uma oficina às 10h apareceria às 13h.
const TIME_ZONE = 'America/Sao_Paulo';

const currencyFormats = new Map<string, Intl.NumberFormat>();

function currencyFormat(currency: string): Intl.NumberFormat {
  let format = currencyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
    currencyFormats.set(currency, format);
  }
  return format;
}

/**
 * Valor numa moeda qualquer. A API manda valores como string decimal
 * (`"35.00"`); um valor que não dá pra ler aparece cru, com a moeda na frente.
 */
export function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  // Intl separa "R$" do número com um espaço inquebrável; normaliza pra um
  // espaço comum, que é o que alguém digitaria ao procurar o texto.
  return currencyFormat(currency).format(value).replace(/\u00a0/g, ' ');
}

/** Preço em reais, o do catálogo e do carrinho. */
export function formatPrice(value: number): string {
  return formatCurrency(value, 'BRL');
}

function parts(iso: string, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options }).formatToParts(
    new Date(iso),
  )) {
    result[part.type] = part.value;
  }
  return result;
}

/** `{ day: '15', month: 'nov', weekday: 'sáb' }` — o calendário do card. */
export function eventCalendar(iso: string): { day: string; month: string; weekday: string } {
  const p = parts(iso, { day: '2-digit', month: 'short', weekday: 'short' });
  return {
    day: p.day,
    month: p.month.replace('.', ''),
    weekday: p.weekday.replace('.', ''),
  };
}

function hour(iso: string): string {
  const p = parts(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const h = String(Number(p.hour));
  return p.minute === '00' ? `${h}h` : `${h}h${p.minute}`;
}

/** "sáb, 15/11 · 10h às 12h" */
export function formatEventWhen(startsAt: string, endsAt: string): string {
  const { weekday } = eventCalendar(startsAt);
  const p = parts(startsAt, { day: '2-digit', month: '2-digit' });
  return `${weekday}, ${p.day}/${p.month} · ${hour(startsAt)} às ${hour(endsAt)}`;
}

/** "sáb 15/11 · 10h" — a versão curta da faixa do topo. */
export function formatEventShort(startsAt: string): string {
  const { weekday } = eventCalendar(startsAt);
  const p = parts(startsAt, { day: '2-digit', month: '2-digit' });
  return `${weekday} ${p.day}/${p.month} · ${hour(startsAt)}`;
}

/** "14:32" no horário do Rio: o prazo de pagamento do pedido. */
export function formatClock(iso: string): string {
  const p = parts(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${p.hour}:${p.minute}`;
}

/**
 * "09/11/2026 14:32" no horário do Rio, qualquer que seja o fuso do navegador
 * ou do servidor. `withYear: false` dá "09/11 14:32", pra listas recentes.
 */
export function formatDateTime(iso: string, { withYear = true }: { withYear?: boolean } = {}): string {
  const p = parts(iso, {
    day: '2-digit',
    month: '2-digit',
    ...(withYear ? { year: 'numeric' as const } : {}),
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const date = withYear ? `${p.day}/${p.month}/${p.year}` : `${p.day}/${p.month}`;
  return `${date} ${p.hour}:${p.minute}`;
}

export function formatEventPrice(price: number | null): string {
  return price === null ? 'Gratuito' : formatPrice(price);
}
