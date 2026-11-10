import { formatEventShort, formatPrice } from '@/lib/format';
import { absoluteUrl, productHref } from '@/features/site/lib/paths';
import type { Product } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * Todos os textos que o site e a loja deixam prontos no WhatsApp, num lugar
 * só, pra quem atende reconhecer de onde a conversa veio.
 */

/** O "oi" genérico: cabeçalho, rodapé, botão flutuante, localização e "em breve". */
export const WHATSAPP_GREETING = 'Oi! Vim pelo site da Daverdinha 🌱';

/** O botão do banner da home. */
export const HERO_MESSAGE = 'Oi! Gostaria de saber mais sobre a Daverdinha 🌱';

/** A agenda sem eventos marcados. */
export const UPCOMING_EVENTS_MESSAGE = 'Oi! Quero saber dos próximos eventos da Daverdinha 🌱';

/** O CEP é de um bairro atendido. */
export function deliveryScheduleMessage(bairro: string): string {
  return `Oi! Quero combinar uma entrega em ${bairro} 🌱`;
}

/** O checkout não achou entrega pro CEP. */
export function checkoutNoDeliveryMessage(cep: string): string {
  return `Oi! Queria comprar pelo site, mas a entrega no CEP ${cep} não apareceu.`;
}

/** A página de acompanhamento do pedido. */
export function orderStatusMessage(code: string): string {
  return `Oi! Sobre o meu pedido ${code} no site.`;
}

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
