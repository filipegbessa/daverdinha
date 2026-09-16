'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePagination } from '@/features/admin/lib/use-pagination';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { CategoryDialog } from '@/features/admin/components/CategoryDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { readableTextColor } from '@/features/admin/lib/readable-text-color';
import type { Category, Paginated } from '@/features/admin/types/admin';

export default function CategoriasPage() {
  const { apiFetch } = useApiClient();
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const { page, setPage } = usePagination('', totalPages);
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useApiResource<Paginated<Category>>(`/categories${page > 1 ? `?page=${page}` : ''}`);
  const categories = data?.items;

  useEffect(() => {
    if (data) setTotalPages(data.totalPages);
  }, [data]);
  const remove = useApiMutation('Erro ao excluir categoria.');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/categories/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {categories && (
        <ul className="mt-6 space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 rounded-lg border border-sand-line p-3">
              <span
                className="rounded-full px-2.5 py-0.5 text-sm font-medium"
                style={{ backgroundColor: category.color, color: readableTextColor(category.color) }}
              >
                {category.name}
              </span>
              <span className="flex-1" />
              <span className="text-sm text-ink-soft">{category.conversationCount ?? 0} conversa(s)</span>
              <Button variant="outline" onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleting(category)}>
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <TablePagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          itemLabel="categorias"
          onPageChange={setPage}
        />
      )}
      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir categoria "${deleting.name}"?`}
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>
            {deleting.conversationCount && deleting.conversationCount > 0
              ? `Essa categoria está em ${deleting.conversationCount} conversa(s). Excluir vai remover a marcação dessas conversas.`
              : 'Essa categoria não está em nenhuma conversa no momento.'}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
