'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApiClient } from '@/features/admin/lib/api-client';
import { CategoryDialog } from '@/features/admin/components/CategoryDialog';
import type { Category } from '@/features/admin/types/admin';

export default function CategoriasPage() {
  const { apiFetch } = useApiClient();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    return apiFetch<Category[]>('/categories')
      .then((data) => {
        setCategories(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as categorias.');
      });
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    setDeletingBusy(true);
    try {
      await apiFetch(`/categories/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir categoria.');
    } finally {
      setDeletingBusy(false);
    }
  }

  function openDeleteDialog(category: Category) {
    setDeleteError(null);
    setDeleting(category);
  }

  function closeDeleteDialog() {
    setDeleting(null);
    setDeleteError(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
      {!categories && !error && <p className="mt-6 text-ink-soft">Carregando...</p>}
      {categories && (
        <ul className="mt-6 space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 rounded-lg border border-sand-line p-3">
              <span
                className="h-4 w-4 flex-none rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span className="flex-1">{category.name}</span>
              <span className="text-sm text-ink-soft">{category.conversationCount ?? 0} conversa(s)</span>
              <Button variant="outline" onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => openDeleteDialog(category)}>
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <Dialog open onOpenChange={(open) => !open && closeDeleteDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir categoria &quot;{deleting.name}&quot;?</DialogTitle>
            </DialogHeader>
            <p>
              {deleting.conversationCount && deleting.conversationCount > 0
                ? `Essa categoria está em ${deleting.conversationCount} conversa(s). Excluir vai remover a marcação dessas conversas.`
                : 'Essa categoria não está em nenhuma conversa no momento.'}
            </p>
            {deleteError && (
              <p role="alert" className="text-berry">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletingBusy}>
                {deletingBusy ? 'Excluindo...' : 'Confirmar exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
