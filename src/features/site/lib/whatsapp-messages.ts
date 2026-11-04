import { formatEventShort, formatPrice } from '@/features/site/lib/format';
import { absoluteUrl, productHref } from '@/features/site/lib/paths';
import type { Product } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * Com o link do produto na mensagem, quem atende no WhatsApp sabe exatamente
 * qual foi pedido — sem "qual vaso? o de 18 ou o de 14?".
 */
export function orderMessage(product: Product): string {
  return `Oi! Quero o *${product.name}* (${formatPrice(product.price)}) — ${absoluteUrl(productHref(product))}`;
}

export function signupMessage(event: SiteEvent): string {
  return `Oi! Quero me inscrever em *${event.title}* (${formatEventShort(event.startsAt)}) 🌱`;
}
