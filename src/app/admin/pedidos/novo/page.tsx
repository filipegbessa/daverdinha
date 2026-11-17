'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, MessageCircle, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { FormCard } from '@/features/admin/components/FormCard';
import { FormField } from '@/features/admin/components/FormField';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/lib/format';
import { maskCep, onlyDigits } from '@/features/site/lib/cep-check';
import { maskPhone, validateCustomer } from '@/features/store/lib/checkout-form';
import { quoteCart } from '@/features/store/lib/store-api';
import { fetchStreetByCep } from '@/features/store/lib/address-by-cep';
import type { Paginated, ProductAdmin } from '@/features/admin/types/admin';
import type { CheckoutQuote } from '@/features/store/types/store';

type Line = { product: ProductAdmin; quantity: number };
type Created = { id: string; code: string; token: string; paymentUrl: string };

const MAX_QUANTITY = 20;

/** "5521999998888" a partir do que foi digitado, pro link do WhatsApp. */
function whatsappNumber(phone: string): string {
  const digits = onlyDigits(phone);
  return digits.length <= 11 ? `55${digits}` : digits;
}

/**
 * Pedido criado no admin, pra venda combinada no WhatsApp: a cliente escolhe
 * os produtos na conversa, a dona monta o pedido aqui e manda o link de
 * pagamento. Preço, estoque e frete são os mesmos do site (cotação da API),
 * o pedido vale com a loja do site fechada ou em pausa e segura a reserva
 * por 24 h. Depois de pago, segue igual a um pedido do site (e-mail, preparo).
 */
export default function NovoPedidoPage() {
  const { apiFetch } = useApiClient();
  const create = useApiMutation('Erro ao criar o pedido.');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data: found } = useApiResource<Paginated<ProductAdmin>>(
    debouncedSearch ? `/products?q=${encodeURIComponent(debouncedSearch)}&active=true&perPage=8` : null,
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', document: '' });
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState({ cep: '', street: '', number: '', complement: '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const cepDigits = onlyDigits(address.cep);
  const quoteCep = deliveryMethod === 'delivery' && cepDigits.length === 8 ? cepDigits : undefined;
  const linesKey = lines.map((l) => `${l.product.id}:${l.quantity}`).join(',');
  const debouncedKey = useDebouncedValue(`${linesKey}|${quoteCep ?? ''}`, 300);

  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    quoteCart(
      lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      quoteCep,
    ).then((data) => {
      if (!cancelled) setQuote(data);
    });
    return () => {
      cancelled = true;
    };
    // A cotação só depende dos itens e do CEP (`debouncedKey`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKey]);

  useEffect(() => {
    if (!quoteCep) return;
    let cancelled = false;
    fetchStreetByCep(quoteCep).then((street) => {
      if (!cancelled && street) setAddress((prev) => (prev.street ? prev : { ...prev, street }));
    });
    return () => {
      cancelled = true;
    };
  }, [quoteCep]);

  const results = useMemo(
    () => (found?.items ?? []).filter((p) => !lines.some((l) => l.product.id === p.id)),
    [found, lines],
  );

  function addProduct(product: ProductAdmin) {
    setLines((prev) => [...prev, { product, quantity: 1 }]);
    setSearch('');
    setErrors((prev) => ({ ...prev, items: undefined }));
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity || 1)) } : l,
      ),
    );
  }

  function validate() {
    const found: Record<string, string | undefined> = { ...validateCustomer(customer) };
    if (lines.length === 0) found.items = 'Adicione pelo menos um produto.';
    if (deliveryMethod === 'delivery') {
      if (cepDigits.length !== 8) found.cep = 'Informe um CEP com 8 números.';
      if (!address.street.trim()) found.street = 'Informe a rua.';
      if (!address.number.trim()) found.number = 'Informe o número (ou "s/n").';
    }
    setErrors(found);
    return Object.values(found).every((v) => !v);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    let result: Created | undefined;
    const ok = await create.run(async () => {
      result = (await apiFetch('/site-orders', {
        method: 'POST',
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: onlyDigits(customer.phone),
            document: customer.document.trim(),
          },
          deliveryMethod,
          ...(deliveryMethod === 'delivery' && {
            address: {
              cep: cepDigits,
              street: address.street.trim(),
              number: address.number.trim(),
              ...(address.complement.trim() && { complement: address.complement.trim() }),
            },
          }),
          ...(notes.trim() && { notes: notes.trim() }),
        }),
      })) as Created;
    });
    if (ok && result) setCreated(result);
  }

  if (created) {
    const orderUrl = `${window.location.origin}/pedido/${encodeURIComponent(created.token)}`;
    const firstName = customer.name.trim().split(/\s+/)[0];
    const message = `Oi, ${firstName}! Aqui está o link pra pagar o pedido ${created.code} da Daverdinha (Pix ou cartão): ${created.paymentUrl}\n\nDepois é só acompanhar o pedido por aqui: ${orderUrl}`;
    return (
      <div className="max-w-2xl">
        <BackLink href="/admin/pedidos">Voltar para pedidos</BackLink>
        <PageHeader title={`Pedido ${created.code} criado`} />
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Mande o link de pagamento pra cliente. O pedido e a reserva dos produtos valem por 24 horas; depois de pago,
            ele aparece em Pedidos como qualquer pedido do site.
          </p>
          <FormField id="paymentUrl" label="Link de pagamento">
            <Input id="paymentUrl" readOnly value={created.paymentUrl} onFocus={(e) => e.currentTarget.select()} />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(created.paymentUrl)
                  .then(() => setCopied(true))
                  .catch(() => {});
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>
            <a
              href={`https://wa.me/${whatsappNumber(customer.phone)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants()}
            >
              <MessageCircle aria-hidden="true" />
              Enviar no WhatsApp
            </a>
            <Link href={`/admin/pedidos/${created.id}`} className={buttonVariants({ variant: 'outline' })}>
              Ver pedido
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const delivery = quote?.delivery;
  const fee = deliveryMethod === 'delivery' && delivery?.available ? delivery.fee : 0;
  const problems = quote?.problems ?? [];

  return (
    <div>
      <BackLink href="/admin/pedidos">Voltar para pedidos</BackLink>
      <PageHeader
        title="Novo pedido"
        description="Pra venda combinada no WhatsApp: monte o pedido e mande o link de pagamento pra cliente."
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="space-y-6">
          <FormCard title="Produtos">
            <FormField id="productSearch" label="Buscar produto" error={errors.items}>
              <Input
                id="productSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome do produto"
                autoComplete="off"
              />
            </FormField>
            {debouncedSearch && (
              <ul aria-label="Produtos encontrados" className="divide-y divide-border rounded-lg border border-border">
                {results.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto.</li>}
                {results.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {product.name}
                      <span className="text-muted-foreground"> · {formatCurrency(product.price, 'BRL')}</span>
                      {product.availability === 'sold_out' && <span className="text-destructive"> · esgotado</span>}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={product.availability === 'sold_out'}
                      onClick={() => addProduct(product)}
                      aria-label={`Adicionar ${product.name}`}
                    >
                      Adicionar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {lines.length > 0 && (
              <ul aria-label="Itens do pedido" className="divide-y divide-border">
                {lines.map(({ product, quantity }) => {
                  const problem = problems.find((p) => p.productId === product.id);
                  return (
                    <li key={product.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                      <span className="min-w-0 flex-1">
                        {product.name}
                        <span className="text-muted-foreground"> · {formatCurrency(product.price, 'BRL')}</span>
                        {problem && (
                          <span className="block text-destructive">
                            {problem.reason === 'insufficient_stock'
                              ? `Só ${problem.available ?? 0} em estoque`
                              : 'Não está disponível'}
                          </span>
                        )}
                      </span>
                      <Input
                        type="number"
                        min={1}
                        max={MAX_QUANTITY}
                        value={quantity}
                        onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                        aria-label={`Quantidade de ${product.name}`}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setLines((prev) => prev.filter((l) => l.product.id !== product.id))}
                        aria-label={`Remover ${product.name}`}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </FormCard>

          <FormCard title="Cliente">
            <FormField id="customerName" label="Nome completo" error={errors.name}>
              <Input
                id="customerName"
                value={customer.name}
                maxLength={64}
                onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="customerPhone" label="WhatsApp" error={errors.phone}>
                <Input
                  id="customerPhone"
                  inputMode="numeric"
                  placeholder="(21) 99999-9999"
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: maskPhone(e.target.value) }))}
                />
              </FormField>
              <FormField
                id="customerEmail"
                label="E-mail"
                hint="O Pagar.me pede, e é pra onde vai a confirmação."
                error={errors.email}
              >
                <Input
                  id="customerEmail"
                  type="email"
                  maxLength={64}
                  value={customer.email}
                  onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))}
                />
              </FormField>
            </div>
            <FormField id="customerDocument" label="CPF, CNPJ ou passaporte" error={errors.document}>
              <Input
                id="customerDocument"
                value={customer.document}
                onChange={(e) => setCustomer((p) => ({ ...p, document: e.target.value }))}
              />
            </FormField>
          </FormCard>

          <FormCard title="Entrega">
            <div role="radiogroup" aria-label="Entrega ou retirada" className="flex gap-4">
              {(['delivery', 'pickup'] as const).map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === method}
                    onChange={() => setDeliveryMethod(method)}
                    className="h-4 w-4 accent-primary"
                  />
                  {method === 'delivery' ? 'Entrega' : 'Retirada no ateliê'}
                </label>
              ))}
            </div>
            {deliveryMethod === 'delivery' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="cep"
                  label="CEP"
                  error={
                    errors.cep ??
                    (quoteCep && delivery && !delivery.available ? 'Não entregamos nesse CEP.' : undefined)
                  }
                >
                  <Input
                    id="cep"
                    inputMode="numeric"
                    value={address.cep}
                    onChange={(e) => setAddress((p) => ({ ...p, cep: maskCep(e.target.value), street: '' }))}
                  />
                </FormField>
                <FormField id="street" label="Rua" error={errors.street}>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                </FormField>
                <FormField id="number" label="Número" error={errors.number}>
                  <Input
                    id="number"
                    value={address.number}
                    onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))}
                  />
                </FormField>
                <FormField id="complement" label="Complemento (opcional)">
                  <Input
                    id="complement"
                    value={address.complement}
                    onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))}
                  />
                </FormField>
              </div>
            )}
            <FormField id="notes" label="Observações (opcional)">
              <Textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
          </FormCard>
        </div>

        <FormCard title="Resumo">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCurrency(quote?.subtotal ?? 0, 'BRL')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{deliveryMethod === 'pickup' ? 'Retirada' : 'Entrega'}</dt>
              <dd className="tabular-nums">
                {deliveryMethod === 'pickup' || fee === 0
                  ? delivery?.available || deliveryMethod === 'pickup'
                    ? 'Grátis'
                    : '—'
                  : formatCurrency(fee, 'BRL')}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency((quote?.subtotal ?? 0) + fee, 'BRL')}</dd>
            </div>
          </dl>
          {create.error && <ErrorText>{create.error}</ErrorText>}
          <Button type="submit" className="w-full" loading={create.isPending} loadingText="Criando...">
            Criar pedido e gerar link
          </Button>
          <p className="text-xs text-muted-foreground">
            Preço, estoque e frete são conferidos de novo na hora de criar. O link vale por 24 horas.
          </p>
        </FormCard>
      </form>
    </div>
  );
}
