'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onlyDigits, maskCep } from '@/features/site/lib/cep-check';
import { formatPrice } from '@/lib/format';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton } from '@/features/site/components/SiteButton';
import { useCart } from '@/features/store/components/CartProvider';
import { STORE_INPUT, StoreField } from '@/features/store/components/StoreField';
import { createCheckout, quoteCart } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import { clearBuyer, readBuyer, saveBuyer } from '@/features/store/lib/buyer-storage';
import { readSavedCoupon, saveCoupon } from '@/features/store/lib/coupon-storage';
import { RedirectingToPayment } from '@/features/store/components/RedirectingToPayment';
import { FreeShippingProgress } from '@/features/store/components/FreeShippingProgress';
import { fetchStreetByCep } from '@/features/store/lib/address-by-cep';
import { RETURNS_HREF } from '@/features/site/lib/paths';
import {
  maskPhone,
  validateCheckout,
  type CheckoutFormErrors,
  type CheckoutFormValues,
  CUSTOMER_NAME_MAX,
  CUSTOMER_EMAIL_MAX,
} from '@/features/store/lib/checkout-form';
import type { CheckoutQuote } from '@/features/store/types/store';
import { checkoutNoDeliveryMessage } from '@/features/site/lib/whatsapp-messages';

const EMPTY: CheckoutFormValues = {
  name: '',
  email: '',
  phone: '',
  document: '',
  deliveryMethod: 'delivery',
  cep: '',
  street: '',
  number: '',
  complement: '',
  notes: '',
  acceptedPolicy: false,
};

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
 * só é limpo quando o pedido foi criado, e aí a tela de "levando você pro
 * pagamento" toma o lugar do formulário até o navegador sair do site.
 *
 * Os dados de contato e o endereço da última compra ficam neste navegador
 * (`buyer-storage`) e voltam preenchidos; "Não é você?" apaga.
 */
export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  // Pra qual CEP é a cotação na tela: enquanto o CEP novo está sendo
  // calculado, a resposta do anterior não pode aparecer como se fosse dele.
  const [quotedCep, setQuotedCep] = useState<string | undefined>(undefined);
  // Cupom: o que está no campo e o que foi aplicado (vai na cotação).
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const [redirecting, setRedirecting] = useState<{ code: string; token: string; paymentUrl: string } | null>(null);

  const cepDigits = onlyDigits(values.cep);
  const quoteCep = cepDigits.length === 8 ? cepDigits : undefined;
  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join(',');

  useEffect(() => {
    // Depois do pedido criado o carrinho fica vazio de propósito: não é hora
    // de mandar pro carrinho, e sim de esperar o navegador ir pro pagamento.
    if (ready && items.length === 0 && !redirecting) router.replace('/carrinho');
  }, [ready, items.length, router, redirecting]);

  useEffect(() => {
    const saved = readBuyer();
    if (!saved) return;
    setValues((prev) => ({ ...prev, ...saved }));
    setRemembered(true);
  }, []);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    setQuoting(true);
    setQuoteFailed(false);
    quoteCart(
      items.map(({ productId, quantity }) => ({ productId, quantity })),
      quoteCep,
      couponCode || undefined,
    ).then((data) => {
      if (cancelled) return;
      setQuoting(false);
      if (data) {
        setQuote(data);
        setQuotedCep(quoteCep);
      } else setQuoteFailed(true);
    });
    return () => {
      cancelled = true;
    };
    // Só produtos, quantidades e CEP mudam a cotação (`itemsKey` cobre os itens).
  }, [ready, itemsKey, quoteCep, quoteAttempt, couponCode]);

  // Cupom que veio num link (`?cupom=`): já chega aplicado.
  useEffect(() => {
    const saved = readSavedCoupon();
    if (!saved) return;
    setCouponInput(saved);
    setCouponCode(saved);
    setCouponOpen(true);
  }, []);

  // Rua: sempre vem do CEP (ViaCEP), nunca digitada — evita endereço
  // divergente do que o frete calculou.
  useEffect(() => {
    if (!quoteCep) {
      setAddressLoading(false);
      setValues((prev) => (prev.street ? { ...prev, street: '' } : prev));
      setErrors((prev) => (prev.street ? { ...prev, street: undefined } : prev));
      return;
    }
    let cancelled = false;
    setAddressLoading(true);
    fetchStreetByCep(quoteCep).then((street) => {
      if (cancelled) return;
      setAddressLoading(false);
      setValues((prev) => ({ ...prev, street: street ?? '' }));
      setErrors((prev) => ({
        ...prev,
        street: street ? undefined : 'Não encontramos a rua desse CEP. Confira os números.',
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [quoteCep]);

  // Retirada desligada na loja: a única opção é entregar.
  useEffect(() => {
    if (quote && !quote.pickup.available && values.deliveryMethod === 'pickup') {
      setValues((prev) => ({ ...prev, deliveryMethod: 'delivery' }));
    }
  }, [quote, values.deliveryMethod]);

  if (redirecting) return <RedirectingToPayment {...redirecting} />;

  if (!ready || items.length === 0) {
    return (
      <p role="status" className="text-ink-soft">
        Carregando seu carrinho...
      </p>
    );
  }

  function forgetBuyer() {
    clearBuyer();
    setRemembered(false);
    setValues((prev) => ({ ...prev, name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '' }));
    setErrors({});
  }

  function set<K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const isDelivery = values.deliveryMethod === 'delivery';
  const delivery = quote?.delivery;
  const coupon = quote?.coupon ?? null;
  const validCoupon = coupon && !('error' in coupon) ? coupon : null;
  const couponError = coupon && 'error' in coupon ? coupon.error : null;
  const discount = validCoupon?.discount ?? 0;
  // Frete grátis pelo cupom ou pela promoção automática (Promoções).
  const promoFreeShipping = Boolean(quote?.freeShipping?.reached);
  const freeShipping = Boolean(validCoupon?.freeShipping) || promoFreeShipping;
  const fee = isDelivery && delivery?.available && !freeShipping ? delivery.fee : 0;
  const problems = quote?.problems ?? [];
  const maxLeadTime = Math.max(0, ...(quote?.items.map((i) => i.leadTimeDays ?? 0) ?? []));
  const quoteIsForCep = !quoting && quoteCep !== undefined && quotedCep === quoteCep;
  const deliveryBlocked = isDelivery && quoteIsForCep && delivery !== undefined && !delivery.available;
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

    window.gtag?.('event', 'begin_checkout', {
      currency: 'BRL',
      value: quote.subtotal - discount + fee,
      items: quote.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });
    setSubmitting(true);
    const result = await createCheckout({
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      customer: {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: onlyDigits(values.phone),
        document: values.document.trim(),
      },
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
      // Só o cupom que a cotação aceitou; um inválido não trava o pedido.
      ...(validCoupon && { couponCode: validCoupon.code }),
    });

    if (result.ok) {
      saveBuyer({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone,
        // Retirada não tem endereço: guarda o da última entrega.
        ...(isDelivery && { cep: values.cep, number: values.number.trim(), complement: values.complement.trim() }),
      });
      setRedirecting({ code: result.code, token: result.token, paymentUrl: result.paymentUrl });
      saveCoupon('');
      clear();
      redirectToPayment(result.paymentUrl);
      return;
    }
    setSubmitting(false);
    if (result.reason === 'coupon_invalid') {
      // O cupom deixou de valer entre a cotação e o pedido (esgotou, venceu):
      // a cotação nova mostra o motivo no campo do cupom.
      setFormError(result.message);
      setQuoteAttempt((n) => n + 1);
    } else if (result.reason === 'store_paused' || result.reason === 'store_closed') {
      // A loja entrou em pausa (ou foi fechada) com o carrinho aberto: o
      // carrinho fica, e a mensagem da cliente explica até quando.
      setFormError(result.message);
    } else if (result.status === 409) {
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
          {remembered && (
            <p className="text-sm text-ink-soft">
              Preenchemos com os dados da sua última compra neste aparelho.{' '}
              <button
                type="button"
                onClick={forgetBuyer}
                className="font-semibold text-moss underline underline-offset-4"
              >
                Não é você? Limpar dados
              </button>
            </p>
          )}
          <StoreField id="checkoutName" label="Nome completo" error={errors.name}>
            <input
              id="checkoutName"
              maxLength={CUSTOMER_NAME_MAX}
              autoComplete="name"
              placeholder="Nome e sobrenome"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className={STORE_INPUT}
            />
          </StoreField>
          <div className="grid gap-4 sm:grid-cols-2">
            <StoreField
              id="checkoutEmail"
              label="E-mail"
              hint="Pra receber o comprovante do pagamento."
              error={errors.email}
            >
              <input
                id="checkoutEmail"
                maxLength={CUSTOMER_EMAIL_MAX}
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
          <StoreField id="checkoutDocument" label="CPF, CNPJ ou passaporte" error={errors.document}>
            <input
              id="checkoutDocument"
              value={values.document}
              onChange={(e) => set('document', e.target.value)}
              className={STORE_INPUT}
            />
          </StoreField>
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
                  {quoteIsForCep && delivery?.available && (
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
              <StoreField
                id="checkoutStreet"
                label="Rua"
                hint={addressLoading ? 'Buscando endereço...' : undefined}
                error={errors.street}
              >
                <input
                  id="checkoutStreet"
                  autoComplete="address-line1"
                  value={values.street}
                  readOnly
                  placeholder="Preenchido pelo CEP"
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
            <button
              type="button"
              onClick={() => setQuoteAttempt((n) => n + 1)}
              className="cursor-pointer font-semibold underline"
            >
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
            <div className="border-t border-sand-line pt-3">
              {!couponOpen ? (
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="text-sm font-semibold text-moss underline underline-offset-4"
                >
                  Tem um cupom?
                </button>
              ) : (
                <StoreField
                  id="checkoutCoupon"
                  label="Cupom"
                  error={couponError ?? undefined}
                  hint={
                    validCoupon ? (validCoupon.freeShipping ? 'Frete grátis aplicado.' : 'Cupom aplicado.') : undefined
                  }
                >
                  <div className="flex gap-2">
                    <input
                      id="checkoutCoupon"
                      value={couponInput}
                      maxLength={30}
                      autoCapitalize="characters"
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        setCouponCode(couponInput.trim());
                        saveCoupon(couponInput.trim());
                      }}
                      className={`${STORE_INPUT} uppercase`}
                    />
                    {couponCode && couponCode === couponInput.trim() ? (
                      <SiteButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setCouponInput('');
                          setCouponCode('');
                          saveCoupon('');
                        }}
                      >
                        Remover
                      </SiteButton>
                    ) : (
                      <SiteButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!couponInput.trim()}
                        onClick={() => {
                          setCouponCode(couponInput.trim());
                          saveCoupon(couponInput.trim());
                        }}
                      >
                        Aplicar
                      </SiteButton>
                    )}
                  </div>
                </StoreField>
              )}
            </div>
            {isDelivery && quote.freeShipping && !validCoupon?.freeShipping && (
              <FreeShippingProgress freeShipping={quote.freeShipping} />
            )}
            <div className="space-y-1 border-t border-sand-line pt-3">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(quote.subtotal)}</span>
              </p>
              {discount > 0 && (
                <p className="flex justify-between text-moss">
                  <span>Cupom {validCoupon?.code}</span>
                  <span className="tabular-nums">−{formatPrice(discount)}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span>{isDelivery ? 'Entrega' : 'Retirada'}</span>
                <span className="tabular-nums">
                  {isDelivery && !delivery?.available
                    ? '—'
                    : fee === 0
                      ? freeShipping && isDelivery
                        ? validCoupon?.freeShipping
                          ? 'Grátis (cupom)'
                          : 'Grátis (promoção)'
                        : 'Grátis'
                      : formatPrice(fee)}
                </span>
              </p>
              <p className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(quote.subtotal - discount + fee)}</span>
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
              <Link href={RETURNS_HREF} target="_blank" className="font-semibold text-moss underline">
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

        <SiteButton
          type="submit"
          disabled={!canSubmit}
          loading={submitting}
          loadingText="Abrindo o pagamento..."
          className="w-full"
        >
          Ir para o pagamento
        </SiteButton>
      </aside>
    </form>
  );
}
