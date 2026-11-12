import type { SiteEvent } from '@/features/site/types/event';
import { eventHref } from '@/features/site/lib/paths';

/** Gratuito: sem preço ou preço zero. Vira "Inscrever-se", sem pagamento. */
export function isFreeEvent(event: Pick<SiteEvent, 'price'>): boolean {
  return event.price === null || event.price === 0;
}

/**
 * Quantos ingressos dá pra pedir numa compra: o limite por compra do evento
 * ou as vagas que sobram, o que for menor. A API confere de novo; aqui só
 * evita um 409 previsível.
 */
export function ticketLimit(event: Pick<SiteEvent, 'maxTicketsPerOrder' | 'spotsLeft'>): number {
  return Math.max(0, Math.min(event.maxTicketsPerOrder, event.spotsLeft ?? Infinity));
}

/** Quantidade vinda da URL ou do seletor, sempre entre 1 e o limite. */
export function clampQuantity(value: unknown, limit: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.max(1, Math.min(n, limit));
}

/** O checkout de ingresso do evento, já com a quantidade escolhida. */
export function ticketCheckoutHref(event: Pick<SiteEvent, 'slug'>, quantity: number): string {
  return `${eventHref(event)}/ingressos?quantidade=${quantity}`;
}
