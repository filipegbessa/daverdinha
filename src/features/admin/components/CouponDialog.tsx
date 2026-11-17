'use client';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { couponSummary } from '@/features/admin/lib/coupon-text';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import type {
  CouponAdmin,
  EventAdmin,
  Paginated,
  ProductAdmin,
  ProductCategoryAdmin,
} from '@/features/admin/types/admin';

type Type = CouponAdmin['type'];
type Scope = CouponAdmin['scope'];

const TYPES: { value: Type; label: string }[] = [
  { value: 'percent', label: 'Porcentagem' },
  { value: 'fixed', label: 'Valor fixo' },
  { value: 'free_shipping', label: 'Frete grátis' },
];

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'order', label: 'Todo o pedido de produtos' },
  { value: 'categories', label: 'Categorias' },
  { value: 'products', label: 'Produtos' },
  { value: 'events', label: 'Ingressos de eventos' },
];

/** Um código fácil de ditar: sem 0/O nem 1/I. */
function randomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
}

const cents = (value: number | null | undefined) => (value == null ? null : Math.round(value * 100));

/**
 * Criar ou editar um cupom, na ordem de quem cadastra: código, benefício,
 * onde vale, condições e validade, com a frase da prévia embaixo. As regras
 * que juntam campos (porcentagem de 1 a 100, escopo com a lista) a API
 * confere e a mensagem aparece no rodapé.
 */
export function CouponDialog({
  coupon,
  onClose,
  onSaved,
}: {
  coupon: CouponAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar o cupom.');
  const [code, setCode] = useState(coupon?.code ?? '');
  const [description, setDescription] = useState(coupon?.description ?? '');
  const [type, setType] = useState<Type>(coupon?.type ?? 'percent');
  const [percent, setPercent] = useState(coupon?.type === 'percent' ? String(coupon.value ?? '') : '');
  const [fixedCents, setFixedCents] = useState(coupon?.type === 'fixed' ? (cents(coupon.value) ?? 0) : 0);
  const [maxDiscountCents, setMaxDiscountCents] = useState<number | null>(cents(coupon?.maxDiscount));
  const [scope, setScope] = useState<Scope>(coupon?.scope ?? 'order');
  const [categoryIds, setCategoryIds] = useState<string[]>(coupon?.categoryIds ?? []);
  const [productIds, setProductIds] = useState<string[]>(coupon?.productIds ?? []);
  const [eventIds, setEventIds] = useState<string[]>(coupon?.eventIds ?? []);
  const [minCents, setMinCents] = useState<number | null>(cents(coupon?.minSubtotal));
  const [startsAt, setStartsAt] = useState(coupon?.startsAt ? toDatetimeLocal(coupon.startsAt) : '');
  const [endsAt, setEndsAt] = useState(coupon?.endsAt ? toDatetimeLocal(coupon.endsAt) : '');
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ? String(coupon.maxUses) : '');
  const [active, setActive] = useState(coupon?.active ?? true);
  const [productSearch, setProductSearch] = useState('');
  const debouncedSearch = useDebouncedValue(productSearch.trim());

  const { data: categories } = useApiResource<ProductCategoryAdmin[]>(
    scope === 'categories' ? '/product-categories' : null,
  );
  const { data: events } = useApiResource<Paginated<EventAdmin>>(scope === 'events' ? '/events?perPage=50' : null);
  const { data: foundProducts } = useApiResource<Paginated<ProductAdmin>>(
    scope === 'products'
      ? `/products?perPage=20${debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : ''}`
      : null,
  );
  // Nomes dos produtos já escolhidos que não estão na busca atual.
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  const value = type === 'percent' ? Number(percent) || null : type === 'fixed' ? fixedCents / 100 : null;
  const names = useMemo(() => {
    if (scope === 'categories') {
      return (categories ?? []).filter((c) => categoryIds.includes(c.id)).map((c) => c.name);
    }
    if (scope === 'products') return productIds.map((id) => productNames[id]).filter(Boolean);
    if (scope === 'events') return (events?.items ?? []).filter((e) => eventIds.includes(e.id)).map((e) => e.title);
    return [];
  }, [scope, categories, categoryIds, productIds, productNames, events, eventIds]);

  const preview = couponSummary(
    {
      type,
      value,
      maxDiscount: type === 'percent' && maxDiscountCents ? maxDiscountCents / 100 : null,
      scope,
      minSubtotal: minCents ? minCents / 100 : null,
      startsAt: fromDatetimeLocal(startsAt),
      endsAt: fromDatetimeLocal(endsAt),
      maxUses: Number(maxUses) || null,
    },
    names,
  );

  function toggle(list: string[], id: string, set: (next: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit() {
    const body = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      type,
      value,
      maxDiscount: type === 'percent' && maxDiscountCents ? maxDiscountCents / 100 : null,
      scope,
      categoryIds: scope === 'categories' ? categoryIds : [],
      productIds: scope === 'products' ? productIds : [],
      eventIds: scope === 'events' ? eventIds : [],
      minSubtotal: minCents ? minCents / 100 : null,
      startsAt: fromDatetimeLocal(startsAt),
      endsAt: fromDatetimeLocal(endsAt),
      maxUses: Number(maxUses) || null,
      active,
    };
    const ok = await save.run(() =>
      coupon
        ? apiFetch(`/coupons/${coupon.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : apiFetch('/coupons', { method: 'POST', body: JSON.stringify(body) }),
    );
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={coupon ? `Editar cupom ${coupon.code}` : 'Novo cupom'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <FormField id="couponCode" label="Código" hint="O que a cliente digita no checkout. Letras e números.">
          <Input
            id="couponCode"
            value={code}
            maxLength={30}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
            className="uppercase"
            required
          />
        </FormField>
        <Button type="button" variant="outline" onClick={() => setCode(randomCode())}>
          Gerar
        </Button>
      </div>
      <FormField id="couponDescription" label="Descrição interna (opcional)" hint="Só aparece aqui no admin.">
        <Input
          id="couponDescription"
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-medium">Benefício</legend>
        <NativeSelect aria-label="Tipo de desconto" value={type} onChange={(e) => setType(e.target.value as Type)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
        {type === 'percent' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="couponPercent" label="Porcentagem (%)">
              <Input
                id="couponPercent"
                type="number"
                min={1}
                max={100}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </FormField>
            <FormField id="couponMaxDiscount" label="Desconto máximo (opcional)" hint="Ex.: 15% até R$ 50,00.">
              <Input
                id="couponMaxDiscount"
                inputMode="numeric"
                placeholder="Sem teto"
                value={maxDiscountCents ? formatCurrency(maxDiscountCents / 100, 'BRL') : ''}
                onChange={(e) => setMaxDiscountCents(centsFromInput(e.target.value) || null)}
              />
            </FormField>
          </div>
        )}
        {type === 'fixed' && (
          <FormField id="couponFixed" label="Valor do desconto">
            <Input
              id="couponFixed"
              inputMode="numeric"
              value={formatCurrency(fixedCents / 100, 'BRL')}
              onChange={(e) => setFixedCents(centsFromInput(e.target.value))}
            />
          </FormField>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-medium">Vale para</legend>
        <NativeSelect aria-label="Onde o cupom vale" value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        {scope === 'categories' && (
          <ul
            aria-label="Categorias"
            className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2"
          >
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggle(categoryIds, c.id, setCategoryIds)}
                    className="h-4 w-4 accent-primary"
                  />
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        {scope === 'products' && (
          <div className="space-y-2">
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
            />
            <ul
              aria-label="Produtos"
              className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2"
            >
              {(foundProducts?.items ?? []).map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={productIds.includes(p.id)}
                      onChange={() => {
                        setProductNames((prev) => ({ ...prev, [p.id]: p.name }));
                        toggle(productIds, p.id, setProductIds);
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    {p.name}
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {productIds.length} {productIds.length === 1 ? 'produto escolhido' : 'produtos escolhidos'}.
            </p>
          </div>
        )}
        {scope === 'events' && (
          <ul aria-label="Eventos" className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {(events?.items ?? []).map((ev) => (
              <li key={ev.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={eventIds.includes(ev.id)}
                    onChange={() => toggle(eventIds, ev.id, setEventIds)}
                    className="h-4 w-4 accent-primary"
                  />
                  {ev.title}
                </label>
              </li>
            ))}
            <li className="pt-1 text-xs text-muted-foreground">Nenhum marcado = todos os eventos.</li>
          </ul>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-medium">Condições e validade</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="couponMin"
            label="Pedido mínimo (opcional)"
            hint="Soma dos itens que entram no cupom, sem frete."
          >
            <Input
              id="couponMin"
              inputMode="numeric"
              placeholder="Sem mínimo"
              value={minCents ? formatCurrency(minCents / 100, 'BRL') : ''}
              onChange={(e) => setMinCents(centsFromInput(e.target.value) || null)}
            />
          </FormField>
          <FormField id="couponMaxUses" label="Limite de usos (opcional)" hint="Total de pedidos que podem usar.">
            <Input
              id="couponMaxUses"
              type="number"
              min={1}
              placeholder="Sem limite"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </FormField>
          <FormField id="couponStarts" label="Começa em (opcional)" hint="Horário do Rio.">
            <Input
              id="couponStarts"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </FormField>
          <FormField id="couponEnds" label="Termina em (opcional)">
            <Input id="couponEnds" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </FormField>
        </div>
        <SwitchField label="Cupom ativo" checked={active} onCheckedChange={setActive} />
      </fieldset>

      <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="font-medium">{code || 'CODIGO'}:</span> {preview}. Não soma com produto em promoção.
      </p>
    </FormDialog>
  );
}
