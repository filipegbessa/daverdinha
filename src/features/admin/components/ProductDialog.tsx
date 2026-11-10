'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { ProductImagesInput } from '@/features/admin/components/ProductImagesInput';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Maior prazo de confecção aceito pela API, em dias. */
const MAX_LEAD_TIME_DAYS = 180;

/**
 * Criar e editar produto. Vai como `multipart/form-data` (texto + fotos no
 * mesmo envio); `apiFetch` já deixa o navegador montar o `Content-Type`.
 * O campo `images` só é enviado quando a cliente escolheu fotos novas —
 * a API troca todas as fotos sempre que ele chega.
 *
 * Estoque: com quantidade é pronta entrega (0 = esgotado); "Sob encomenda"
 * desliga a quantidade e pede o prazo de confecção. Sob encomenda vai como
 * `stock=""`, que a API grava como `null`. Voltando pra pronta entrega, o
 * prazo não é enviado e fica guardado na API pra reaparecer depois.
 */
export function ProductDialog({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductAdmin | null;
  categories: ProductCategoryAdmin[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar produto.');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [priceCents, setPriceCents] = useState(() => Math.round((product?.price ?? 0) * 100));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [madeToOrder, setMadeToOrder] = useState(product ? product.stock === null : false);
  const [stock, setStock] = useState(product?.stock?.toString() ?? '');
  const [leadTimeDays, setLeadTimeDays] = useState(product?.leadTimeDays?.toString() ?? '');
  const [fieldErrors, setFieldErrors] = useState<{ stock?: string; leadTimeDays?: string }>({});
  const [files, setFiles] = useState<File[]>([]);

  // O cursor sempre volta pro fim: o valor é inteiramente formatado a cada
  // tecla, então editar no meio do número não faz sentido nessa máscara.
  useEffect(() => {
    const el = priceInputRef.current;
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [priceCents]);

  function validateStock() {
    const errors: typeof fieldErrors = {};
    if (madeToOrder) {
      const days = Number(leadTimeDays);
      if (leadTimeDays === '' || !Number.isInteger(days) || days < 1 || days > MAX_LEAD_TIME_DAYS) {
        errors.leadTimeDays = `Informe o prazo de confecção, de 1 a ${MAX_LEAD_TIME_DAYS} dias.`;
      }
    } else {
      const quantity = Number(stock);
      if (stock === '' || !Number.isInteger(quantity) || quantity < 0) {
        errors.stock = 'Informe a quantidade em estoque (0 se estiver esgotado).';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateStock()) return;
    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('price', (priceCents / 100).toFixed(2));
    form.append('categoryId', categoryId);
    form.append('active', String(active));
    form.append('featured', String(featured));
    if (madeToOrder) {
      form.append('stock', '');
      form.append('leadTimeDays', leadTimeDays);
    } else {
      form.append('stock', stock);
    }
    files.forEach((file) => form.append('images', file));

    const ok = await save.run(() =>
      product
        ? apiFetch(`/products/${product.id}`, { method: 'PATCH', body: form })
        : apiFetch('/products', { method: 'POST', body: form }),
    );
    if (ok) onSaved();
  }

  if (categories.length === 0) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
          </DialogHeader>
          <p>Cadastre uma categoria primeiro: todo produto fica dentro de uma.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Link href="/admin/categorias" className={buttonVariants()}>
              Ir para categorias
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <FormDialog
      title={product ? 'Editar produto' : 'Novo produto'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="productName" label="Nome">
        <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      {product && (
        <p className="text-sm text-muted-foreground">
          Endereço no site:{' '}
          <span className="font-mono">
            /produtos/{product.category.slug}/{product.slug}
          </span>
          . Ele não muda ao renomear.
        </p>
      )}
      <FormField id="productDescription" label="Descrição">
        <Textarea
          id="productDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="productPrice" label="Preço (R$)">
          <Input
            id="productPrice"
            ref={priceInputRef}
            inputMode="numeric"
            value={formatCurrency(priceCents / 100, 'BRL')}
            onChange={(e) => setPriceCents(centsFromInput(e.target.value))}
          />
        </FormField>
        <FormField id="productCategory" label="Categoria">
          <NativeSelect
            id="productCategory"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {!category.active ? ' (inativa)' : ''}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormField
            id="productStock"
            label="Estoque"
            hint={madeToOrder ? 'Sob encomenda não tem limite de quantidade.' : '0 = esgotado.'}
            error={fieldErrors.stock}
          >
            <Input
              id="productStock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={madeToOrder ? '' : stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={madeToOrder}
            />
          </FormField>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={madeToOrder}
              onChange={(e) => {
                setMadeToOrder(e.target.checked);
                setFieldErrors({});
              }}
              className="h-4 w-4 accent-primary"
            />
            Sob encomenda
          </label>
        </div>
        {madeToOrder && (
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
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          </FormField>
        )}
      </div>
      <ProductImagesInput currentImages={product?.images ?? []} files={files} onChange={setFiles} />
      <SwitchField label="Aparece no site" checked={active} onCheckedChange={setActive} />
      <SwitchField label="Destaque" checked={featured} onCheckedChange={setFeatured} />
    </FormDialog>
  );
}
