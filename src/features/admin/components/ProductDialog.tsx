'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorText } from '@/features/admin/components/StatusMessage';
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>
        {categories.length === 0 ? (
          <div className="space-y-4">
            <p>Cadastre uma categoria primeiro: todo produto fica dentro de uma.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Link
                href="/admin/categorias"
                className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Ir para categorias
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="productName" className="mb-1 block font-medium">
                Nome
              </label>
              <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {product && (
              <p className="text-sm text-ink-soft">
                Endereço no site: <span className="font-mono">/produtos/{product.category.slug}/{product.slug}</span>.
                Ele não muda ao renomear.
              </p>
            )}
            <div>
              <label htmlFor="productDescription" className="mb-1 block font-medium">
                Descrição
              </label>
              <Textarea
                id="productDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="productPrice" className="mb-1 block font-medium">
                  Preço (R$)
                </label>
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
              </div>
              <div>
                <label htmlFor="productCategory" className="mb-1 block font-medium">
                  Categoria
                </label>
                <select
                  id="productCategory"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-base md:text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {!category.active ? ' (inativa)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="productOrder" className="mb-1 block font-medium">
                Ordem
              </label>
              <Input
                id="productOrder"
                type="number"
                min={0}
                step={1}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                aria-describedby="productOrderHelp"
                className="w-28"
              />
              <p id="productOrderHelp" className="mt-1 text-sm text-ink-soft">
                Menor aparece primeiro.
              </p>
            </div>
            <ProductImagesInput currentImages={product?.images ?? []} files={files} onChange={setFiles} />
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} aria-label="Aparece no site" />
              <span>Aparece no site</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={featured} onCheckedChange={setFeatured} aria-label="Mostrar na home" />
              <span>Mostrar na home (destaque)</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            {save.error && <ErrorText>{save.error}</ErrorText>}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
