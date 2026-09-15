'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { CATEGORY_COLORS } from '@/features/admin/lib/category-colors';
import type { Category } from '@/features/admin/types/admin';

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
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (category) {
        await apiFetch(`/categories/${category.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, color }),
        });
      } else {
        await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name, color }) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
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
            <span className="mb-1 block font-medium">Cor</span>
            <div role="radiogroup" aria-label="Cor da categoria" className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  role="radio"
                  aria-checked={color === swatch}
                  aria-label={swatch}
                  onClick={() => setColor(swatch)}
                  className={`h-8 w-8 rounded-full border-2 ${
                    color === swatch ? 'border-ink' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-berry">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
