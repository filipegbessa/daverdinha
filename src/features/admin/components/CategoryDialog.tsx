'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField } from '@/features/admin/components/FormField';
import { readableTextColor } from '@/features/admin/lib/readable-text-color';
import type { Category } from '@/features/admin/types/admin';

// What a brand-new category starts on before the operator picks anything.
const INITIAL_COLOR = '#185928';

export function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar marcador.');
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? INITIAL_COLOR);

  async function handleSubmit() {
    const body = JSON.stringify({ name, color });
    const ok = await save.run(() =>
      category
        ? apiFetch(`/categories/${category.id}`, { method: 'PATCH', body })
        : apiFetch('/categories', { method: 'POST', body }),
    );
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={category ? 'Editar marcador' : 'Novo marcador'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="categoryName" label="Nome">
        <Input id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      <FormField id="categoryColor" label="Cor">
        <div className="flex items-center gap-3">
          <input
            id="categoryColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-border bg-background p-1"
          />
          {/* A live preview of the chip, because the same colour reads very
              differently as a 40px swatch and as a label behind text. */}
          <span
            data-testid="category-color-preview"
            className="rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: color, color: readableTextColor(color) }}
          >
            {name || 'Prévia'}
          </span>
        </div>
      </FormField>
    </FormDialog>
  );
}
