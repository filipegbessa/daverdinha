'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { ProductImagesInput } from '@/features/admin/components/ProductImagesInput';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/**
 * Criar e editar produto. Vai como `multipart/form-data` (texto + fotos no
 * mesmo envio); `apiFetch` já deixa o navegador montar o `Content-Type`.
 * O campo `images` só é enviado quando a cliente escolheu fotos novas —
 * a API troca todas as fotos sempre que ele chega.
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
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [order, setOrder] = useState(String(product?.order ?? 0));
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmit() {
    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('price', price);
    form.append('categoryId', categoryId);
    form.append('order', String(Number(order) || 0));
    form.append('active', String(active));
    form.append('featured', String(featured));
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
        <p className="text-sm text-ink-soft">
          Endereço no site: <span className="font-mono">/produtos/{product.category.slug}/{product.slug}</span>.
          Ele não muda ao renomear.
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
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </FormField>
        <FormField id="productCategory" label="Categoria">
          <NativeSelect id="productCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {!category.active ? ' (inativa)' : ''}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="productOrder" label="Ordem" hint="Menor aparece primeiro.">
        <Input
          id="productOrder"
          type="number"
          min={0}
          step={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-28"
        />
      </FormField>
      <ProductImagesInput currentImages={product?.images ?? []} files={files} onChange={setFiles} />
      <SwitchField label="Aparece no site" checked={active} onCheckedChange={setActive} />
      <SwitchField label="Mostrar na home" checked={featured} onCheckedChange={setFeatured} />
    </FormDialog>
  );
}
