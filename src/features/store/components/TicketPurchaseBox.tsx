'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { signupMessage } from '@/features/site/lib/whatsapp-messages';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton } from '@/features/site/components/SiteButton';
import { QuantityStepper } from '@/features/store/components/QuantityStepper';
import { isFreeEvent, ticketCheckoutHref, ticketLimit } from '@/features/store/lib/tickets';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * A compra na página do evento: preço, vagas, quantidade e o botão que leva
 * ao checkout do ingresso. Nenhum campo de texto aqui, como no mercado
 * (`docs/benchmark-compra-ingresso.md`): a página do evento é pra decidir.
 * No celular, uma barra fixa repete preço e botão enquanto a pessoa lê.
 */
export function TicketPurchaseBox({ event }: { event: SiteEvent }) {
  const free = isFreeEvent(event);
  const limit = ticketLimit(event);
  const [quantity, setQuantity] = useState(1);
  const soldOut = event.soldOut || limit === 0;
  const action = free ? 'Inscrever-se' : 'Comprar ingresso';
  const href = ticketCheckoutHref(event, quantity);
  const price = free ? 'Gratuito' : `${formatPrice(event.price ?? 0)} por pessoa`;
  const spots =
    event.spotsLeft === null ? null : event.spotsLeft === 1 ? 'Resta 1 vaga' : `Restam ${event.spotsLeft} vagas`;

  if (soldOut) {
    return (
      <div className="mt-8 space-y-3">
        <SiteButton disabled className="w-full sm:w-auto">
          Esgotado
        </SiteButton>
        <ContactLink
          href={getWhatsAppUrl(signupMessage(event))}
          channel="whatsapp"
          location="event"
          className="flex items-center gap-2 font-semibold text-moss underline underline-offset-4"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Falar no WhatsApp
        </ContactLink>
      </div>
    );
  }

  return (
    <>
      <section aria-label={action} className="mt-8 space-y-4 rounded-2xl border border-sand-line bg-sand/60 p-5">
        <div>
          <p className="text-lg font-semibold text-ink tabular-nums">{price}</p>
          {spots && <p className="text-sm text-ink-soft">{spots}</p>}
        </div>
        {limit > 1 && (
          <div className="flex items-center gap-3">
            <span id="ticket-quantity-label" className="text-sm font-medium text-ink">
              {free ? 'Pessoas' : 'Ingressos'}
            </span>
            <QuantityStepper
              value={quantity}
              max={limit}
              onChange={setQuantity}
              label={free ? 'Quantidade de pessoas' : 'Quantidade de ingressos'}
            />
          </div>
        )}
        <SiteButton href={href} className="w-full sm:w-auto">
          {action}
        </SiteButton>
      </section>

      {/* Barra fixa no celular. Deixa a direita livre pro botão flutuante do
          WhatsApp; o rodapé do site já tem folga embaixo pra ele (pb-24). */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-line bg-paper/95 py-3 pr-20 pl-4 shadow-soft backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink tabular-nums">
            {free ? 'Gratuito' : formatPrice((event.price ?? 0) * quantity)}
            {quantity > 1 && <span className="block text-xs font-normal text-ink-soft">{quantity} ingressos</span>}
          </p>
          <SiteButton href={href} size="sm" aria-label={`${action} (barra)`}>
            {action}
          </SiteButton>
        </div>
      </div>
    </>
  );
}
