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
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { FormCard } from '@/features/admin/components/FormCard';
import { ProductImagesInput } from '@/features/admin/components/ProductImagesInput';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Maior prazo de confecção aceito pela API, em dias. */
const MAX_LEAD_TIME_DAYS = 180;

/** O que o formulário edita, como texto onde a cliente digita. */
interface Values {
  name: string;
  description: string;
  priceCents: number;
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
    priceCents: Math.round((product?.price ?? 0) * 100),
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
  const [fieldErrors, setFieldErrors] = useState<{ stock?: string; leadTimeDays?: string }>({});
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

  function validateStock() {
    const errors: typeof fieldErrors = {};
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
    if (!validateStock()) return;
    const form = new FormData();
    form.append('name', values.name.trim());
    form.append('description', values.description.trim());
    form.append('price', (values.priceCents / 100).toFixed(2));
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
            <FormField id="productName" label="Nome">
              <Input id="productName" value={values.name} onChange={(e) => set('name', e.target.value)} required />
            </FormField>
            <FormField id="productDescription" label="Descrição">
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
            <ProductImagesInput
              currentImages={product?.images ?? []}
              files={files}
              onChange={(next) => {
                setSavedNotice(null);
                setFiles(next);
              }}
            />
          </FormCard>

          <FormCard title="Preço">
            <FormField id="productPrice" label="Preço (R$)">
              <Input
                id="productPrice"
                ref={priceInputRef}
                inputMode="numeric"
                value={formatCurrency(values.priceCents / 100, 'BRL')}
                onChange={(e) => set('priceCents', centsFromInput(e.target.value))}
                className="max-w-48"
              />
            </FormField>
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
                <p className="text-sm tabular-nums">{formatCurrency(values.priceCents / 100, 'BRL')}</p>
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
