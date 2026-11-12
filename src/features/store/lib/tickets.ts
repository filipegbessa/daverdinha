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

/** "Restam 5 vagas" / "Resta 1 vaga"; `null` quando o evento não tem limite. */
export function spotsLeftText(spotsLeft: number | null): string | null {
  if (spotsLeft === null) return null;
  return spotsLeft === 1 ? 'Resta 1 vaga' : `Restam ${spotsLeft} vagas`;
}

/**
 * O aviso de quando a pessoa chega no limite pelo seletor: diz se o que
 * travou foram as vagas ou o máximo por compra. Antes do limite, nada.
 */
export function quantityLimitText(
  event: Pick<SiteEvent, 'maxTicketsPerOrder' | 'spotsLeft' | 'price'>,
  quantity: number,
): string | null {
  const limit = ticketLimit(event);
  if (limit <= 1 || quantity < limit) return null;
  if (event.spotsLeft !== null && event.spotsLeft <= event.maxTicketsPerOrder) {
    return limit === 1 ? 'Só resta 1 vaga.' : `Só restam ${limit} vagas.`;
  }
  return isFreeEvent(event)
    ? `O máximo por inscrição é ${limit} pessoas.`
    : `O máximo por compra é ${limit} ingressos.`;
}

/** O checkout de ingresso do evento, já com a quantidade escolhida. */
export function ticketCheckoutHref(event: Pick<SiteEvent, 'slug'>, quantity: number): string {
  return `${eventHref(event)}/ingressos?quantidade=${quantity}`;
}
