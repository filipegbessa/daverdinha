'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorText } from '@/features/admin/components/StatusMessage';
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
  const save = useApiMutation('Erro ao salvar categoria.');
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? INITIAL_COLOR);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = JSON.stringify({ name, color });
    const ok = await save.run(() =>
      category
        ? apiFetch(`/categories/${category.id}`, { method: 'PATCH', body })
        : apiFetch('/categories', { method: 'POST', body }),
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
            <label htmlFor="categoryName" className="mb-1 block font-medium">
              Nome
            </label>
            <Input id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="categoryColor" className="mb-1 block font-medium">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <input
                id="categoryColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-sand-line bg-paper p-1"
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
