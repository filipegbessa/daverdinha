'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onlyDigits, maskCep } from '@/features/site/lib/cep-check';
import { formatPrice } from '@/lib/format';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { useCart } from '@/features/store/components/CartProvider';
import { STORE_INPUT, StoreField } from '@/features/store/components/StoreField';
import { createCheckout, quoteCart } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import {
  maskPhone,
  validateCheckout,
  type CheckoutFormErrors,
  type CheckoutFormValues,
} from '@/features/store/lib/checkout-form';
import type { CheckoutQuote } from '@/features/store/types/store';
import { checkoutNoDeliveryMessage } from '@/features/site/lib/whatsapp-messages';

const EMPTY: CheckoutFormValues = {
  name: '',
  email: '',
  phone: '',
  deliveryMethod: 'delivery',
  cep: '',
  street: '',
  number: '',
  complement: '',
  notes: '',
  acceptedPolicy: false,
};

const POLICY_HREF = '/trocas-e-devolucoes';

/** Por que não dá pra entregar, em palavras de cliente. */
function deliveryUnavailableText(delivery: Extract<CheckoutQuote['delivery'], { available: false }>): string {
  switch (delivery.reason) {
    case 'no_cep':
      return 'Digite o CEP pra calcular a entrega.';
    case 'unresolved':
      return 'Não encontramos esse CEP. Confira os números.';
    default:
      return delivery.bairro
        ? `Ainda não entregamos em ${delivery.bairro} pelo site.`
        : 'Ainda não entregamos nesse endereço pelo site.';
  }
}

/**
 * O checkout numa página só: dados, entrega ou retirada, resumo. Preço e
 * frete são os da cotação, que é refeita quando o CEP fica completo; o
 * pedido é criado na API e o cliente vai pra página de pagamento. O carrinho
 * só é limpo quando o pedido foi criado.
 */
export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cepDigits = onlyDigits(values.cep);
  const quoteCep = cepDigits.length === 8 ? cepDigits : undefined;
  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join(',');

  useEffect(() => {
    if (ready && items.length === 0) router.replace('/carrinho');
  }, [ready, items.length, router]);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    setQuoting(true);
    setQuoteFailed(false);
    quoteCart(
      items.map(({ productId, quantity }) => ({ productId, quantity })),
      quoteCep,
    ).then((data) => {
      if (cancelled) return;
      setQuoting(false);
      if (data) setQuote(data);
      else setQuoteFailed(true);
    });
    return () => {
      cancelled = true;
    };
    // Só produtos, quantidades e CEP mudam a cotação (`itemsKey` cobre os itens).
  }, [ready, itemsKey, quoteCep, quoteAttempt]);

  // Retirada desligada na loja: a única opção é entregar.
  useEffect(() => {
    if (quote && !quote.pickup.available && values.deliveryMethod === 'pickup') {
      setValues((prev) => ({ ...prev, deliveryMethod: 'delivery' }));
    }
  }, [quote, values.deliveryMethod]);

  if (!ready || items.length === 0) {
    return <p role="status" className="text-ink-soft">
        Carregando seu carrinho...
      </p>;
  }

  function set<K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const isDelivery = values.deliveryMethod === 'delivery';
  const delivery = quote?.delivery;
  const fee = isDelivery && delivery?.available ? delivery.fee : 0;
  const problems = quote?.problems ?? [];
  const maxLeadTime = Math.max(0, ...(quote?.items.map((i) => i.leadTimeDays ?? 0) ?? []));
  const deliveryBlocked = isDelivery && quoteCep !== undefined && delivery !== undefined && !delivery.available;
  const canSubmit = quote !== null && !quoting && problems.length === 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = validateCheckout(values);
    if (isDelivery && quote && !quote.delivery.available && !found.cep) {
      found.cep = deliveryUnavailableText(quote.delivery);
    }
    setErrors(found);
    if (Object.keys(found).length > 0 || !quote) return;

    setSubmitting(true);
    const result = await createCheckout({
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      customer: { name: values.name.trim(), email: values.email.trim(), phone: onlyDigits(values.phone) },
      deliveryMethod: values.deliveryMethod,
      ...(isDelivery && {
        address: {
          cep: cepDigits,
          street: values.street.trim(),
          number: values.number.trim(),
          ...(values.complement.trim() && { complement: values.complement.trim() }),
        },
      }),
      ...(values.notes.trim() && { notes: values.notes.trim() }),
    });

    if (result.ok) {
      clear();
      redirectToPayment(result.paymentUrl);
      return;
    }
    setSubmitting(false);
    if (result.status === 409) {
      // Algo mudou no estoque ou no catálogo: a cotação nova mostra o quê.
      setFormError('Alguns itens mudaram desde que você montou o carrinho.');
      setQuoteAttempt((n) => n + 1);
    } else if (result.status === 422) {
      setErrors((prev) => ({ ...prev, cep: result.message }));
      setQuoteAttempt((n) => n + 1);
    } else {
      setFormError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-ink">Seus dados</legend>
          <StoreField id="checkoutName" label="Nome" error={errors.name}>
            <input
              id="checkoutName"
              autoComplete="name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className={STORE_INPUT}
            />
          </StoreField>
          <div className="grid gap-4 sm:grid-cols-2">
            <StoreField id="checkoutEmail" label="E-mail" hint="Pra receber o comprovante do pagamento." error={errors.email}>
              <input
                id="checkoutEmail"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                className={STORE_INPUT}
              />
            </StoreField>
            <StoreField id="checkoutPhone" label="WhatsApp" error={errors.phone}>
              <input
                id="checkoutPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(21) 99999-9999"
                value={values.phone}
                onChange={(e) => set('phone', maskPhone(e.target.value))}
                className={STORE_INPUT}
              />
            </StoreField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-ink">Entrega</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-moss-line p-4 has-checked:border-moss has-checked:bg-moss/5">
              <input
                type="radio"
                name="deliveryMethod"
                checked={isDelivery}
                onChange={() => set('deliveryMethod', 'delivery')}
                className="mt-1 accent-moss"
              />
              <span>
                <span className="block font-semibold text-ink">Entregar</span>
                <span className="text-sm text-ink-soft">No Rio, nos bairros atendidos.</span>
              </span>
            </label>
            {quote?.pickup.available !== false && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-moss-line p-4 has-checked:border-moss has-checked:bg-moss/5">
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={!isDelivery}
                  onChange={() => set('deliveryMethod', 'pickup')}
                  className="mt-1 accent-moss"
                />
                <span>
                  <span className="block font-semibold text-ink">Retirar no ateliê</span>
                  <span className="text-sm text-ink-soft">Sem custo de entrega.</span>
                </span>
              </label>
            )}
          </div>

          {!isDelivery && quote?.pickup.available && (
            <div className="rounded-xl bg-sand/60 p-4 text-sm text-ink">
              <p className="font-semibold">{quote.pickup.address}</p>
              <p className="text-ink-soft">{quote.pickup.hours}</p>
              {quote.pickup.instructions && <p className="mt-1 text-ink-soft">{quote.pickup.instructions}</p>}
            </div>
          )}

          {isDelivery && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                <StoreField id="checkoutCep" label="CEP" error={errors.cep}>
                  <input
                    id="checkoutCep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={values.cep}
                    onChange={(e) => set('cep', maskCep(e.target.value))}
                    className={STORE_INPUT}
                  />
                </StoreField>
                <div aria-live="polite" className="self-end pb-2.5 text-sm">
                  {quoteCep && quoting && <span className="text-ink-soft">Calculando a entrega...</span>}
                  {quoteCep && !quoting && delivery?.available && (
                    <span className="text-ink">
                      Entrega em {delivery.bairro}: <strong>{formatPrice(delivery.fee)}</strong>
                    </span>
                  )}
                  {deliveryBlocked && !errors.cep && delivery && !delivery.available && (
                    <span className="text-berry">
                      {deliveryUnavailableText(delivery)}{' '}
                      <ContactLink
                        href={getWhatsAppUrl(checkoutNoDeliveryMessage(values.cep))}
                        channel="whatsapp"
                        location="checkout"
                        className="font-semibold underline"
                      >
                        Falar no WhatsApp
                      </ContactLink>
                    </span>
                  )}
                </div>
              </div>
              <StoreField id="checkoutStreet" label="Rua" error={errors.street}>
                <input
                  id="checkoutStreet"
                  autoComplete="address-line1"
                  value={values.street}
                  onChange={(e) => set('street', e.target.value)}
                  className={STORE_INPUT}
                />
              </StoreField>
              <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                <StoreField id="checkoutNumber" label="Número" error={errors.number}>
                  <input
                    id="checkoutNumber"
                    value={values.number}
                    onChange={(e) => set('number', e.target.value)}
                    className={STORE_INPUT}
                  />
                </StoreField>
                <StoreField id="checkoutComplement" label="Complemento (opcional)">
                  <input
                    id="checkoutComplement"
                    autoComplete="address-line2"
                    value={values.complement}
                    onChange={(e) => set('complement', e.target.value)}
                    className={STORE_INPUT}
                  />
                </StoreField>
              </div>
            </div>
          )}

          <StoreField id="checkoutNotes" label="Observações (opcional)" error={errors.notes}>
            <textarea
              id="checkoutNotes"
              rows={3}
              maxLength={500}
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={STORE_INPUT}
            />
          </StoreField>
        </fieldset>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-sand-line bg-sand/60 p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Resumo</h2>
        {quoteFailed && !quote && (
          <p className="text-sm text-berry">
            Não foi possível carregar os preços.{' '}
            <button type="button" onClick={() => setQuoteAttempt((n) => n + 1)} className="cursor-pointer font-semibold underline">
              Tentar de novo
            </button>
          </p>
        )}
        {!quote && !quoteFailed && <p className="text-sm text-ink-soft">Atualizando preços...</p>}
        {quote && (
          <div aria-live="polite" className="space-y-3">
            <ul className="space-y-2 text-sm">
              {quote.items.map((line) => (
                <li key={line.productId} className="flex justify-between gap-3">
                  <span>
                    {line.quantity}× {line.name}
                    {line.availability === 'made_to_order' && (
                      <span className="block text-ink-soft">
                        Sob encomenda{line.leadTimeDays ? ` · até ${line.leadTimeDays} dias` : ''}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatPrice(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-sand-line pt-3">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(quote.subtotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>{isDelivery ? 'Entrega' : 'Retirada'}</span>
                <span className="tabular-nums">
                  {isDelivery && !delivery?.available ? '—' : fee === 0 ? 'Grátis' : formatPrice(fee)}
                </span>
              </p>
              <p className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(quote.subtotal + fee)}</span>
              </p>
              {quote.installments > 1 && (
                <p className="text-sm text-ink-soft">Pix ou cartão em até {quote.installments}x sem juros.</p>
              )}
            </div>
            {maxLeadTime > 0 && (
              <p className="text-sm text-ink-soft">
                Seu pedido tem itens sob encomenda: a {isDelivery ? 'entrega' : 'retirada'} acontece depois da
                confecção, em até {maxLeadTime} dias.
              </p>
            )}
            {problems.length > 0 && (
              <p className="text-sm font-semibold text-berry">
                Alguns itens mudaram.{' '}
                <Link href="/carrinho" className="underline">
                  Voltar ao carrinho
                </Link>
              </p>
            )}
          </div>
        )}

        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.acceptedPolicy}
              onChange={(e) => set('acceptedPolicy', e.target.checked)}
              aria-invalid={errors.acceptedPolicy ? true : undefined}
              aria-describedby={errors.acceptedPolicy ? 'checkoutPolicy-error' : undefined}
              className="mt-1 accent-moss"
            />
            <span>
              Li a{' '}
              <Link href={POLICY_HREF} target="_blank" className="font-semibold text-moss underline">
                política de trocas
              </Link>
              .
            </span>
          </label>
          {errors.acceptedPolicy && (
            <p id="checkoutPolicy-error" className="mt-1 text-sm font-medium text-berry">
              {errors.acceptedPolicy}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm font-medium text-berry">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={submitting}
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-moss px-6 py-3.5 font-semibold text-paper shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft disabled:cursor-not-allowed disabled:bg-sand-line disabled:text-ink-soft"
        >
          {submitting ? 'Abrindo o pagamento...' : 'Ir para o pagamento'}
        </button>
      </aside>
    </form>
  );
}
