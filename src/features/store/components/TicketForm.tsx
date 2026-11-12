'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { onlyDigits } from '@/features/site/lib/cep-check';
import { formatPrice } from '@/lib/format';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { signupMessage } from '@/features/site/lib/whatsapp-messages';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton } from '@/features/site/components/SiteButton';
import { STORE_INPUT, StoreField } from '@/features/store/components/StoreField';
import { createTicketCheckout } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import { maskPhone, validateCustomer } from '@/features/store/lib/checkout-form';
import type { SiteEvent } from '@/features/site/types/event';

type Buyer = { name: string; email: string; phone: string; notes: string };
type Errors = Partial<Record<keyof Buyer, string>> & { attendees?: (string | undefined)[] };

/** Fechado por um 409: a venda foi desligada ou encerrada depois que a página abriu. */
type Closed = 'tickets_closed' | 'not_available' | 'sold_out';

const CLOSED_TEXT: Record<Closed, string> = {
  tickets_closed: 'A venda de ingressos pelo site está fechada no momento.',
  not_available: 'As vendas desse evento foram encerradas.',
  sold_out: 'Esgotado.',
};

/**
 * Compra de ingresso (ou inscrição, se for gratuito) na página do evento.
 * Não usa o carrinho e não depende da loja de produtos: só do `ticketSales`
 * do evento, que a API já combina com o interruptor do Dashboard. Preço e
 * vagas que valem são os da API; aqui o limite só evita um 409 previsível.
 *
 * Sem o aceite da política de cancelamento por enquanto: a página
 * `/cancelamento-de-ingressos` espera as respostas da cliente.
 */
export function TicketForm({ event }: { event: SiteEvent }) {
  const router = useRouter();
  const free = event.price === null || event.price === 0;
  const [attendees, setAttendees] = useState(['']);
  const [buyer, setBuyer] = useState<Buyer>({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [spotsLeft, setSpotsLeft] = useState(event.spotsLeft);
  const [maxPerOrder, setMaxPerOrder] = useState(event.maxTicketsPerOrder);
  const [closed, setClosed] = useState<Closed | null>(event.soldOut ? 'sold_out' : null);

  const limit = Math.max(0, Math.min(maxPerOrder, spotsLeft ?? Infinity));
  const total = (event.price ?? 0) * attendees.length;
  const whatsapp = getWhatsAppUrl(signupMessage(event));

  if (closed) {
    return (
      <div className="mt-8 space-y-3">
        {closed === 'sold_out' ? (
          <SiteButton disabled className="w-full sm:w-auto">
            Esgotado
          </SiteButton>
        ) : (
          <p role="status" className="font-medium text-berry">
            {CLOSED_TEXT[closed]}
          </p>
        )}
        <ContactLink
          href={whatsapp}
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

  function setBuyerField(key: keyof Buyer, value: string) {
    setBuyer((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function setAttendee(index: number, value: string) {
    setAttendees((prev) => prev.map((name, i) => (i === index ? value : name)));
    setErrors((prev) => ({ ...prev, attendees: prev.attendees?.map((e, i) => (i === index ? undefined : e)) }));
  }

  function validate(): Errors {
    const found: Errors = validateCustomer(buyer);
    const attendeeErrors = attendees.map((name) =>
      name.trim().length < 2 || name.trim().length > 100 ? 'Informe o nome de quem vai participar.' : undefined,
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
    if (attendees.length > limit) {
      setFormError(`O máximo por compra é ${limit} ingressos.`);
      return;
    }

    window.gtag?.('event', 'begin_checkout', {
      currency: 'BRL',
      value: total,
      items: [{ item_id: event.id, item_name: event.title, price: event.price ?? 0, quantity: attendees.length }],
    });
    setSubmitting(true);
    const result = await createTicketCheckout({
      eventId: event.id,
      attendees: attendees.map((name) => ({ name: name.trim() })),
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
      case 'sold_out':
        if (result.spotsLeft === 0) {
          setClosed('sold_out');
          return;
        }
        if (result.spotsLeft !== undefined) setSpotsLeft(result.spotsLeft);
        setFormError(`Restam ${result.spotsLeft} vagas.`);
        return;
      case 'too_many':
        if (result.max !== undefined) setMaxPerOrder(result.max);
        setFormError(`O máximo por compra é ${result.max ?? limit} ingressos.`);
        return;
      default:
        setFormError(result.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={free ? 'Inscrição' : 'Comprar ingresso'}
      className="mt-8 space-y-6 rounded-2xl border border-sand-line bg-sand/60 p-5"
    >
      <fieldset className="space-y-3">
        <legend className="font-serif text-xl font-semibold text-ink">Participantes</legend>
        {attendees.map((name, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <StoreField
                id={`attendee-${index}`}
                label={`Nome do participante ${index + 1}`}
                error={errors.attendees?.[index]}
              >
                <input
                  id={`attendee-${index}`}
                  value={name}
                  onChange={(e) => setAttendee(index, e.target.value)}
                  className={STORE_INPUT}
                />
              </StoreField>
            </div>
            {attendees.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setAttendees((prev) => prev.filter((_, i) => i !== index));
                  setErrors((prev) => ({ ...prev, attendees: undefined }));
                }}
                aria-label={`Remover participante ${index + 1}`}
                className="mb-1.5 cursor-pointer rounded-full p-2 text-ink-soft hover:bg-sand hover:text-berry"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {attendees.length < limit && (
          <button
            type="button"
            onClick={() => setAttendees((prev) => [...prev, ''])}
            className="cursor-pointer text-sm font-semibold text-moss underline underline-offset-4"
          >
            + Adicionar participante
          </button>
        )}
        <p className="text-sm text-ink-soft">Máximo de {limit} ingressos por compra.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-xl font-semibold text-ink">Seus dados</legend>
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
      </fieldset>

      <div className="space-y-3 border-t border-sand-line pt-4">
        <p aria-live="polite" className="text-lg font-semibold text-ink tabular-nums">
          {free ? 'Gratuito' : `${attendees.length} × ${formatPrice(event.price ?? 0)} = ${formatPrice(total)}`}
        </p>
        {formError && (
          <p role="alert" className="text-sm font-medium text-berry">
            {formError}
          </p>
        )}
        <SiteButton
          type="submit"
          loading={submitting}
          loadingText={free ? 'Confirmando...' : 'Abrindo o pagamento...'}
          className="w-full sm:w-auto"
        >
          {free ? 'Confirmar inscrição' : 'Ir para o pagamento'}
        </SiteButton>
      </div>
    </form>
  );
}
