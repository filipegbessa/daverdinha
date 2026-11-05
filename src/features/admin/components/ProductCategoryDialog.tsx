'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import type { ProductCategoryAdmin } from '@/features/admin/types/admin';

export function ProductCategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: ProductCategoryAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar categoria.');
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [order, setOrder] = useState(String(category?.order ?? 0));
  const [active, setActive] = useState(category?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = JSON.stringify({ name: name.trim(), description: description.trim(), order: Number(order) || 0, active });
    const ok = await save.run(() =>
      category
        ? apiFetch(`/product-categories/${category.id}`, { method: 'PATCH', body })
        : apiFetch('/product-categories', { method: 'POST', body }),
    );
    if (ok) onSaved();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="productCategoryName" className="mb-1 block font-medium">
              Nome
            </label>
            <Input id="productCategoryName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {category && (
            <p className="text-sm text-ink-soft">
              Endereço no site: <span className="font-mono">/produtos/{category.slug}</span>. Ele não muda ao renomear.
            </p>
          )}
          <div>
            <label htmlFor="productCategoryDescription" className="mb-1 block font-medium">
              Descrição
            </label>
            <Textarea
              id="productCategoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="productCategoryDescriptionHelp"
              rows={3}
            />
            <p id="productCategoryDescriptionHelp" className="mt-1 text-sm text-ink-soft">
              Aparece no topo da página da categoria no site e ajuda no Google.
            </p>
          </div>
          <div>
            <label htmlFor="productCategoryOrder" className="mb-1 block font-medium">
              Ordem
            </label>
            <Input
              id="productCategoryOrder"
              type="number"
              min={0}
              step={1}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              aria-describedby="productCategoryOrderHelp"
              className="w-28"
            />
            <p id="productCategoryOrderHelp" className="mt-1 text-sm text-ink-soft">
              Menor aparece primeiro.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Aparece no site" />
            <span>Aparece no site</span>
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
      </DialogContent>
    </Dialog>
  );
}
