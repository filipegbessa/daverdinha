/**
 * Formatação compartilhada entre card, página e dados estruturados — uma
 * fórmula só, pra o preço do card e o da página de produto nunca divergirem.
 */

// A loja é no Rio; o servidor da Vercel roda em UTC. Sem o fuso explícito,
// uma oficina às 10h apareceria às 13h.
const TIME_ZONE = 'America/Sao_Paulo';

const priceFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(value: number): string {
  // Intl separa "R$" do número com um espaço inquebrável; normaliza pra um
  // espaço comum, que é o que alguém digitaria ao procurar o texto.
  return priceFormat.format(value).replace(/ /g, ' ');
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

/** "09/11/2026" no horário do Rio. */
export function formatDate(iso: string): string {
  const p = parts(iso, { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${p.day}/${p.month}/${p.year}`;
}

export function formatEventPrice(price: number | null): string {
  return price === null ? 'Gratuito' : formatPrice(price);
}
