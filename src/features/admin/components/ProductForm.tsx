'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { FormCard } from '@/features/admin/components/FormCard';
import { ImagesInput } from '@/features/admin/components/ImagesInput';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Maior prazo de confecção aceito pela API, em dias. */
const MAX_LEAD_TIME_DAYS = 180;

/** O que o formulário edita, como texto onde a cliente digita. */
interface Values {
  name: string;
  description: string;
  priceCents: number;
  /** `null` = sem promoção. */
  promoCents: number | null;
  /** Promoção com início e/ou fim; os horários são do Rio (`datetime-local`). */
  scheduled: boolean;
  promoStart: string;
  promoEnd: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  madeToOrder: boolean;
  stock: string;
  leadTimeDays: string;
}

function valuesOf(product: Partial<ProductAdmin> | null, categories: ProductCategoryAdmin[]): Values {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    // O preço cheio: com promoção valendo, `price` já é o promocional.
    priceCents: Math.round((product?.regularPrice ?? product?.price ?? 0) * 100),
    promoCents: product?.promoPrice == null ? null : Math.round(product.promoPrice * 100),
    scheduled: Boolean(product?.promoStartsAt || product?.promoEndsAt),
    promoStart: product?.promoStartsAt ? toDatetimeLocal(product.promoStartsAt) : '',
    promoEnd: product?.promoEndsAt ? toDatetimeLocal(product.promoEndsAt) : '',
    categoryId: product?.categoryId ?? categories[0]?.id ?? '',
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    madeToOrder: product ? product.stock === null : false,
    stock: product?.stock?.toString() ?? '',
    leadTimeDays: product?.leadTimeDays?.toString() ?? '',
  };
}

/**
 * O cadastro de produto em página própria (`/admin/produtos/novo` e
 * `/admin/produtos/<id>`), no lugar do antigo modal: cards por assunto, com o
 * que descreve e vende o produto à esquerda e o estado e a organização à
 * direita (como o padrão "resource details" da Shopify). Envia
 * `multipart/form-data` (texto + fotos); o campo `images` só vai quando a
 * cliente escolheu fotos novas, porque a API troca todas.
 *
 * Estoque: com quantidade é pronta entrega (0 = esgotado); "Sob encomenda"
 * desliga a quantidade e pede o prazo de confecção (vai como `stock=""`,
 * gravado `null`). Voltando pra pronta entrega, o prazo fica guardado na API.
 *
 * `product` é o que está salvo (editar); `initial` só preenche um produto
 * novo (duplicar), sem fotos. Com alterações não salvas, fechar ou recarregar
 * a aba pede confirmação.
 */
export function ProductForm({
  product,
  initial,
  categories,
  onSaved,
  notice,
}: {
  product: ProductAdmin | null;
  initial?: Partial<ProductAdmin>;
  categories: ProductCategoryAdmin[];
  onSaved: (saved: ProductAdmin) => void;
  /** Aviso do topo, ex.: "Produto criado." depois de criar. */
  notice?: string | null;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar produto.');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [baseline, setBaseline] = useState(() => valuesOf(product ?? initial ?? null, categories));
  const [values, setValues] = useState(baseline);
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    description?: string;
    stock?: string;
    leadTimeDays?: string;
    promo?: string;
    promoEnd?: string;
  }>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(notice ?? null);

  const dirty = useMemo(
    () => files.length > 0 || (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== baseline[key]),
    [values, baseline, files],
  );
  // Produto novo sempre pode salvar; um salvo, só com alteração.
  const canSave = !product || dirty;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // O cursor sempre volta pro fim: o valor é formatado inteiro a cada tecla.
  useEffect(() => {
    const el = priceInputRef.current;
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [values.priceCents]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setSavedNotice(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const errors: typeof fieldErrors = {};
    if (values.name.trim() === '') {
      errors.name = 'Informe o nome do produto.';
    }
    if (values.description.trim() === '') {
      errors.description = 'Informe a descrição do produto.';
    }
    if (values.promoCents !== null && values.promoCents >= values.priceCents) {
      errors.promo = 'O preço promocional precisa ser menor que o preço.';
    }
    if (values.scheduled && values.promoStart && values.promoEnd && values.promoEnd <= values.promoStart) {
      errors.promoEnd = 'O fim precisa ser depois do início.';
    }
    if (values.madeToOrder) {
      const days = Number(values.leadTimeDays);
      if (values.leadTimeDays === '' || !Number.isInteger(days) || days < 1 || days > MAX_LEAD_TIME_DAYS) {
        errors.leadTimeDays = `Informe o prazo de confecção, de 1 a ${MAX_LEAD_TIME_DAYS} dias.`;
      }
    } else {
      const quantity = Number(values.stock);
      if (values.stock === '' || !Number.isInteger(quantity) || quantity < 0) {
        errors.stock = 'Informe a quantidade em estoque (0 se estiver esgotado).';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    const form = new FormData();
    form.append('name', values.name.trim());
    form.append('description', values.description.trim());
    form.append('price', (values.priceCents / 100).toFixed(2));
    // Vazio limpa: sem promoção, ou promoção sem data.
    form.append('promoPrice', values.promoCents === null ? '' : (values.promoCents / 100).toFixed(2));
    form.append('promoStartsAt', (values.scheduled && fromDatetimeLocal(values.promoStart)) || '');
    form.append('promoEndsAt', (values.scheduled && fromDatetimeLocal(values.promoEnd)) || '');
    form.append('categoryId', values.categoryId);
    form.append('active', String(values.active));
    form.append('featured', String(values.featured));
    if (values.madeToOrder) {
      form.append('stock', '');
      form.append('leadTimeDays', values.leadTimeDays);
    } else {
      form.append('stock', values.stock);
    }
    files.forEach((file) => form.append('images', file));

    let saved: ProductAdmin | undefined;
    const ok = await save.run(async () => {
      saved = (await (product
        ? apiFetch(`/products/${product.id}`, { method: 'PATCH', body: form })
        : apiFetch('/products', { method: 'POST', body: form }))) as ProductAdmin;
    });
    if (!ok || !saved) return;
    // O que acabou de salvar vira a nova referência: sem "alterações não salvas".
    const next = valuesOf(saved, categories);
    setBaseline(next);
    setValues(next);
    setFiles([]);
    if (product) setSavedNotice('Alterações salvas.');
    onSaved(saved);
  }

  function discard() {
    setValues(baseline);
    setFiles([]);
    setFieldErrors({});
    save.clearError();
  }

  const category = categories.find((c) => c.id === values.categoryId);
  const cover = files.length === 0 ? product?.images[0] : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">
      {savedNotice && (
        <p role="status" className="mb-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {savedNotice}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* No celular o status vem primeiro (como na Shopify); no computador, na lateral. */}
        <div className="order-2 space-y-6 lg:order-1">
          <FormCard title="Informações">
            <FormField id="productName" label="Nome" error={fieldErrors.name}>
              <Input id="productName" value={values.name} onChange={(e) => set('name', e.target.value)} required />
            </FormField>
            <FormField id="productDescription" label="Descrição" error={fieldErrors.description}>
              <Textarea
                id="productDescription"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                rows={6}
                required
              />
            </FormField>
          </FormCard>

          <FormCard title="Imagens">
            <ImagesInput
              id="productImages"
              currentImages={product?.images ?? []}
              files={files}
              onChange={(next) => {
                setSavedNotice(null);
                setFiles(next);
              }}
            />
          </FormCard>

          <FormCard title="Preço">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="productPrice" label="Preço (R$)">
                <Input
                  id="productPrice"
                  ref={priceInputRef}
                  inputMode="numeric"
                  value={formatCurrency(values.priceCents / 100, 'BRL')}
                  onChange={(e) => set('priceCents', centsFromInput(e.target.value))}
                />
              </FormField>
              <FormField
                id="productPromoPrice"
                label="Preço promocional (opcional)"
                hint={
                  values.promoCents !== null && values.promoCents < values.priceCents && values.priceCents > 0
                    ? `O site mostra "de ${formatCurrency(values.priceCents / 100, 'BRL')} por ${formatCurrency(
                        values.promoCents / 100,
                        'BRL',
                      )}", ${Math.round((1 - values.promoCents / values.priceCents) * 100)}% de desconto.`
                    : 'Vazio = sem promoção.'
                }
                error={fieldErrors.promo}
              >
                <Input
                  id="productPromoPrice"
                  inputMode="numeric"
                  placeholder="Sem promoção"
                  value={values.promoCents === null ? '' : formatCurrency(values.promoCents / 100, 'BRL')}
                  onChange={(e) => {
                    const cents = centsFromInput(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, promo: undefined }));
                    set('promoCents', cents > 0 ? cents : null);
                  }}
                />
              </FormField>
            </div>
            {values.promoCents !== null && (
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values.scheduled}
                    onChange={(e) => set('scheduled', e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Agendar a promoção
                </label>
                {values.scheduled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="productPromoStart" label="Começa em" hint="Vazio = já vale. Horário do Rio.">
                      <Input
                        id="productPromoStart"
                        type="datetime-local"
                        value={values.promoStart}
                        onChange={(e) => set('promoStart', e.target.value)}
                      />
                    </FormField>
                    <FormField
                      id="productPromoEnd"
                      label="Termina em"
                      hint="Vazio = até você tirar."
                      error={fieldErrors.promoEnd}
                    >
                      <Input
                        id="productPromoEnd"
                        type="datetime-local"
                        value={values.promoEnd}
                        onChange={(e) => {
                          setFieldErrors((prev) => ({ ...prev, promoEnd: undefined }));
                          set('promoEnd', e.target.value);
                        }}
                      />
                    </FormField>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFieldErrors((prev) => ({ ...prev, promo: undefined, promoEnd: undefined }));
                    setValues((prev) => ({
                      ...prev,
                      promoCents: null,
                      scheduled: false,
                      promoStart: '',
                      promoEnd: '',
                    }));
                    setSavedNotice(null);
                  }}
                >
                  Tirar a promoção
                </Button>
              </div>
            )}
          </FormCard>

          <FormCard title="Estoque e prazo">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FormField
                  id="productStock"
                  label="Estoque"
                  hint={values.madeToOrder ? 'Sob encomenda não tem limite de quantidade.' : '0 = esgotado.'}
                  error={fieldErrors.stock}
                >
                  <Input
                    id="productStock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={values.madeToOrder ? '' : values.stock}
                    onChange={(e) => set('stock', e.target.value)}
                    disabled={values.madeToOrder}
                  />
                </FormField>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values.madeToOrder}
                    onChange={(e) => {
                      set('madeToOrder', e.target.checked);
                      setFieldErrors({});
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  Sob encomenda
                </label>
              </div>
              {values.madeToOrder && (
                <FormField
                  id="productLeadTime"
                  label="Prazo de confecção (dias)"
                  hint="Aparece no site junto com o selo “Sob encomenda”."
                  error={fieldErrors.leadTimeDays}
                >
                  <Input
                    id="productLeadTime"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_LEAD_TIME_DAYS}
                    step={1}
                    value={values.leadTimeDays}
                    onChange={(e) => set('leadTimeDays', e.target.value)}
                  />
                </FormField>
              )}
            </div>
          </FormCard>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <FormCard title="Status">
            <SwitchField label="Aparece no site" checked={values.active} onCheckedChange={(v) => set('active', v)} />
            <p className="text-sm text-muted-foreground">
              {values.active ? 'Visível na loja e no catálogo.' : 'Oculto: só aparece aqui no admin.'}
            </p>
          </FormCard>

          <FormCard title="Organização">
            <FormField id="productCategory" label="Categoria">
              <NativeSelect
                id="productCategory"
                value={values.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active ? ' (inativa)' : ''}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <SwitchField label="Destaque" checked={values.featured} onCheckedChange={(v) => set('featured', v)} />
            <p className="text-sm text-muted-foreground">Destaque aparece na vitrine da home.</p>
          </FormCard>

          <FormCard title="Prévia">
            <div aria-label="Prévia do card na loja" className="overflow-hidden rounded-lg border border-border">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no admin, sem otimizador
                <img src={cover} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  {files.length > 0 ? 'Fotos novas ao salvar' : 'Sem foto'}
                </div>
              )}
              <div className="space-y-0.5 p-3">
                <p className="text-xs text-muted-foreground">{category?.name ?? 'Sem categoria'}</p>
                <p className="font-medium">{values.name.trim() || 'Nome do produto'}</p>
                {values.promoCents !== null && values.promoCents < values.priceCents ? (
                  <p className="text-sm tabular-nums">
                    <s className="text-muted-foreground">{formatCurrency(values.priceCents / 100, 'BRL')}</s>{' '}
                    {formatCurrency(values.promoCents / 100, 'BRL')}
                  </p>
                ) : (
                  <p className="text-sm tabular-nums">{formatCurrency(values.priceCents / 100, 'BRL')}</p>
                )}
              </div>
            </div>
          </FormCard>

          {product && (
            <FormCard title="Link no site">
              <p className="font-mono text-sm break-all">
                /produtos/{product.category.slug}/{product.slug}
              </p>
              <p className="text-sm text-muted-foreground">O endereço não muda ao renomear.</p>
            </FormCard>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          {save.error && <ErrorText className="mr-auto">{save.error}</ErrorText>}
          {product && dirty && !save.error && (
            <p className="mr-auto text-sm text-muted-foreground">Alterações não salvas</p>
          )}
          {product && dirty && (
            <Button type="button" variant="outline" onClick={discard} disabled={save.isPending}>
              Descartar alterações
            </Button>
          )}
          <Button type="submit" loading={save.isPending} loadingText="Salvando..." disabled={!canSave}>
            {product ? 'Salvar' : 'Criar produto'}
          </Button>
        </div>
      </div>
    </form>
  );
}
