'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { onlyDigits } from '@/features/site/lib/cep-check';
import { formatEventWhen, formatPrice } from '@/lib/format';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { signupMessage } from '@/features/site/lib/whatsapp-messages';
import { eventHref } from '@/features/site/lib/paths';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton } from '@/features/site/components/SiteButton';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { eventPlace } from '@/features/site/components/EventCard';
import { STORE_INPUT, StoreField } from '@/features/store/components/StoreField';
import { QuantityStepper } from '@/features/store/components/QuantityStepper';
import { createTicketCheckout } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import { maskPhone, validateCustomer } from '@/features/store/lib/checkout-form';
import {
  clampQuantity,
  isFreeEvent,
  quantityLimitText,
  spotsLeftText,
  ticketLimit,
} from '@/features/store/lib/tickets';
import type { SiteEvent } from '@/features/site/types/event';

type Buyer = { name: string; email: string; phone: string; notes: string };
type Errors = Partial<Record<keyof Buyer, string>> & { attendees?: (string | undefined)[] };

/** Fechado por um 409: a venda foi desligada ou encerrada depois que a página abriu. */
type Closed = 'tickets_closed' | 'not_available' | 'sold_out';

const CLOSED_TEXT: Record<Closed, string> = {
  tickets_closed: 'A venda de ingressos pelo site está fechada no momento.',
  not_available: 'As vendas desse evento foram encerradas.',
  sold_out: 'As vagas desse evento acabaram.',
};

const ATTENDEE_ERROR = 'Informe o nome de quem vai participar.';

/** Lista de nomes do tamanho da quantidade, guardando o que já foi digitado. */
function resize(names: string[], quantity: number): string[] {
  return Array.from({ length: quantity }, (_, i) => names[i] ?? '');
}

/**
 * O checkout do ingresso (`/agenda/<slug>/ingressos`), numa página só e sem
 * login: seus dados, os participantes (já na quantidade escolhida na página
 * do evento) e o resumo. Por que assim: `docs/benchmark-compra-ingresso.md`.
 * Não usa o carrinho e não depende da loja de produtos. Preço e vagas que
 * valem são os da API; aqui o limite só evita um 409 previsível.
 *
 * Sem o aceite da política de cancelamento por enquanto: a página
 * `/cancelamento-de-ingressos` espera as respostas da cliente.
 */
export function TicketCheckout({ event, initialQuantity }: { event: SiteEvent; initialQuantity: number }) {
  const router = useRouter();
  const free = isFreeEvent(event);
  const [spotsLeft, setSpotsLeft] = useState(event.spotsLeft);
  const [maxPerOrder, setMaxPerOrder] = useState(event.maxTicketsPerOrder);
  const limit = ticketLimit({ maxTicketsPerOrder: maxPerOrder, spotsLeft });
  const [attendees, setAttendees] = useState(() => resize([], clampQuantity(initialQuantity, limit)));
  // A maioria compra pra si: o primeiro participante é o comprador até desmarcar.
  const [buyerAttends, setBuyerAttends] = useState(true);
  const [buyer, setBuyer] = useState<Buyer>({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [closed, setClosed] = useState<Closed | null>(event.soldOut || limit === 0 ? 'sold_out' : null);

  const quantity = attendees.length;
  const limitText = quantityLimitText({ maxTicketsPerOrder: maxPerOrder, spotsLeft, price: event.price }, quantity);
  const total = (event.price ?? 0) * quantity;
  const names = buyerAttends ? [buyer.name, ...attendees.slice(1)] : attendees;
  const totalText = free ? 'Gratuito' : formatPrice(total);
  const back = eventHref(event);

  if (closed) {
    return (
      <div className="space-y-4">
        <p role="status" className="text-lg font-medium text-berry">
          {CLOSED_TEXT[closed]}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <SiteButton href={back} variant="secondary">
            Voltar ao evento
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
      </div>
    );
  }

  function setBuyerField(key: keyof Buyer, value: string) {
    setBuyer((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function setAttendee(index: number, value: string) {
    setAttendees((prev) => prev.map((name, i) => (i === index ? value : name)));
    setErrors((prev) => ({ ...prev, attendees: prev.attendees?.map((e, i) => (i === index ? undefined : e)) }));
  }

  function changeQuantity(next: number) {
    setAttendees((prev) => resize(prev, clampQuantity(next, limit)));
    setErrors((prev) => ({ ...prev, attendees: undefined }));
    setFormError(null);
  }

  function validate(): Errors {
    const found: Errors = validateCustomer(buyer);
    const attendeeErrors = names.map((name, i) =>
      // O primeiro, quando é o comprador, já é validado como "Seu nome".
      (i > 0 || !buyerAttends) && (name.trim().length < 2 || name.trim().length > 100) ? ATTENDEE_ERROR : undefined,
    );
    if (attendeeErrors.some(Boolean)) found.attendees = attendeeErrors;
    if (buyer.notes.length > 500) found.notes = 'Use até 500 caracteres.';
    return found;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    window.gtag?.('event', 'begin_checkout', {
      currency: 'BRL',
      value: total,
      items: [{ item_id: event.id, item_name: event.title, price: event.price ?? 0, quantity }],
    });
    setSubmitting(true);
    const result = await createTicketCheckout({
      eventId: event.id,
      attendees: names.map((name) => ({ name: name.trim() })),
      customer: { name: buyer.name.trim(), email: buyer.email.trim(), phone: onlyDigits(buyer.phone) },
      ...(buyer.notes.trim() && { notes: buyer.notes.trim() }),
    });

    if (result.ok) {
      if (result.paymentUrl) redirectToPayment(result.paymentUrl);
      else router.push(`/pedido/${encodeURIComponent(result.token)}`);
      return;
    }
    setSubmitting(false);
    switch (result.reason) {
      case 'tickets_closed':
      case 'not_available':
        setClosed(result.reason);
        return;
      case 'sold_out': {
        const left = result.spotsLeft ?? 0;
        if (left === 0) {
          setClosed('sold_out');
          return;
        }
        // Sobraram menos vagas do que o pedido: ajusta a quantidade e avisa.
        setSpotsLeft(left);
        setAttendees((prev) => resize(prev, Math.min(prev.length, left)));
        setFormError(
          left === 1 ? 'Só resta 1 vaga. Ajustamos a quantidade.' : `Só restam ${left} vagas. Ajustamos a quantidade.`,
        );
        return;
      }
      case 'too_many': {
        const max = result.max ?? limit;
        setMaxPerOrder(max);
        setAttendees((prev) => resize(prev, Math.min(prev.length, max)));
        setFormError(`O máximo por compra é ${max} ingressos. Ajustamos a quantidade.`);
        return;
      }
      default:
        setFormError(result.message);
    }
  }

  const summary = (
    <div className="space-y-3">
      <p className="flex justify-between gap-3 text-ink tabular-nums">
        <span>
          {quantity} × {free ? 'inscrição gratuita' : formatPrice(event.price ?? 0)}
        </span>
        {!free && <span>{totalText}</span>}
      </p>
      <p className="flex justify-between gap-3 border-t border-sand-line pt-3 text-lg font-semibold text-ink tabular-nums">
        <span>Total</span>
        <span>{totalText}</span>
      </p>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={free ? 'Inscrição' : 'Comprar ingresso'}
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
    >
      <div className="space-y-8">
        {/* Celular: o resumo recolhido no topo, sem sumir; e de novo acima do botão. */}
        <details className="rounded-2xl border border-sand-line bg-sand/60 p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">
            <span>Resumo · {totalText}</span>
            <ChevronDown className="size-5" aria-hidden="true" />
          </summary>
          <div className="mt-3">{summary}</div>
        </details>

        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-ink">Seus dados</legend>
          <p className="text-sm text-ink-soft">Pra mandar a confirmação e avisar se algo mudar no evento.</p>
          <StoreField id="ticketBuyerName" label="Seu nome" error={errors.name}>
            <input
              id="ticketBuyerName"
              autoComplete="name"
              value={buyer.name}
              onChange={(e) => setBuyerField('name', e.target.value)}
              className={STORE_INPUT}
            />
          </StoreField>
          <div className="grid gap-4 sm:grid-cols-2">
            <StoreField id="ticketBuyerEmail" label="E-mail" error={errors.email}>
              <input
                id="ticketBuyerEmail"
                type="email"
                autoComplete="email"
                value={buyer.email}
                onChange={(e) => setBuyerField('email', e.target.value)}
                className={STORE_INPUT}
              />
            </StoreField>
            <StoreField id="ticketBuyerPhone" label="WhatsApp" error={errors.phone}>
              <input
                id="ticketBuyerPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(21) 99999-9999"
                value={buyer.phone}
                onChange={(e) => setBuyerField('phone', maskPhone(e.target.value))}
                className={STORE_INPUT}
              />
            </StoreField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-ink">Participantes</legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">{spotsLeftText(spotsLeft) ?? ''}</p>
            {limit > 1 && (
              <QuantityStepper
                value={quantity}
                max={limit}
                onChange={changeQuantity}
                label={free ? 'Quantidade de pessoas' : 'Quantidade de ingressos'}
              />
            )}
          </div>
          {limitText && (
            <p role="status" className="text-sm text-ink-soft">
              {limitText}
            </p>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-ink">
            <input
              type="checkbox"
              checked={buyerAttends}
              onChange={(e) => {
                setBuyerAttends(e.target.checked);
                setErrors((prev) => ({ ...prev, attendees: undefined }));
              }}
              className="size-4 accent-moss"
            />
            Eu vou participar
          </label>
          {names.map((name, index) => {
            const isBuyer = index === 0 && buyerAttends;
            return (
              <StoreField
                key={index}
                id={`attendee-${index}`}
                label={`Participante ${index + 1}`}
                error={errors.attendees?.[index]}
              >
                <input
                  id={`attendee-${index}`}
                  value={name}
                  readOnly={isBuyer}
                  placeholder={isBuyer ? 'O seu nome, preenchido acima' : 'Nome completo'}
                  onChange={(e) => setAttendee(index, e.target.value)}
                  className={isBuyer ? `${STORE_INPUT} bg-sand/60 text-ink-soft` : STORE_INPUT}
                />
              </StoreField>
            );
          })}
        </fieldset>

        <StoreField id="ticketNotes" label="Observações (opcional)" error={errors.notes}>
          <textarea
            id="ticketNotes"
            rows={2}
            maxLength={500}
            value={buyer.notes}
            onChange={(e) => setBuyerField('notes', e.target.value)}
            className={STORE_INPUT}
          />
        </StoreField>
      </div>

      <aside
        aria-label="Resumo"
        className="h-fit space-y-4 rounded-2xl border border-sand-line bg-sand/60 p-5 lg:sticky lg:top-24"
      >
        <div className="flex gap-3">
          <ImagePlaceholder src={event.imageUrl ?? undefined} alt="" className="size-16 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{event.title}</p>
            <p className="text-sm text-ink-soft">{formatEventWhen(event.startsAt, event.endsAt)}</p>
            <p className="text-sm text-ink-soft">{eventPlace(event)}</p>
          </div>
        </div>
        {summary}
        {formError && (
          <p role="alert" className="text-sm font-medium text-berry">
            {formError}
          </p>
        )}
        <SiteButton
          type="submit"
          loading={submitting}
          loadingText={free ? 'Confirmando...' : 'Abrindo o pagamento...'}
          className="w-full"
        >
          {free ? 'Confirmar inscrição' : 'Ir para o pagamento'}
        </SiteButton>
        {!free && (
          <p className="text-sm text-ink-soft">
            A vaga fica reservada por 60 minutos enquanto você paga, com Pix ou cartão.
          </p>
        )}
        <Link href={back} className="block text-sm font-semibold text-moss underline underline-offset-4">
          Voltar ao evento
        </Link>
      </aside>
    </form>
  );
}
