'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
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

  async function handleSubmit() {
    const body = JSON.stringify({ name: name.trim(), description: description.trim(), order: Number(order) || 0, active });
    const ok = await save.run(() =>
      category
        ? apiFetch(`/product-categories/${category.id}`, { method: 'PATCH', body })
        : apiFetch('/product-categories', { method: 'POST', body }),
    );
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={category ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="productCategoryName" label="Nome">
        <Input id="productCategoryName" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      {category && (
        <p className="text-sm text-ink-soft">
          Endereço no site: <span className="font-mono">/produtos/{category.slug}</span>. Ele não muda ao renomear.
        </p>
      )}
      <FormField
        id="productCategoryDescription"
        label="Descrição"
        hint="Aparece no topo da página da categoria no site e ajuda no Google."
      >
        <Textarea
          id="productCategoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </FormField>
      <FormField id="productCategoryOrder" label="Ordem" hint="Menor aparece primeiro.">
        <Input
          id="productCategoryOrder"
          type="number"
          min={0}
          step={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-28"
        />
      </FormField>
      <SwitchField label="Aparece no site" checked={active} onCheckedChange={setActive} />
    </FormDialog>
  );
}
