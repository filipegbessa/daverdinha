'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { CategoryDialog } from '@/features/admin/components/CategoryDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { readableTextColor } from '@/features/admin/lib/readable-text-color';
import type { Category } from '@/features/admin/types/admin';

export default function MarcadoresPage() {
  const { apiFetch } = useApiClient();
  const { data, items: categories, isLoading, isRefreshing, error, refetch, pagination } =
    usePaginatedResource<Category>('/categories');
  const remove = useApiMutation('Erro ao excluir marcador.');
  const busy = remove.isPending || isRefreshing;
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
      <PageHeader title="Marcadores">
        <Button onClick={() => setEditing('new')}>Novo marcador</Button>
      </PageHeader>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={busy}
          isEmpty={categories.length === 0}
          empty="Nenhum marcador ainda. Crie um pra organizar as conversas."
        >
          {categories.map((category) => (
            <AdminListItem key={category.id}>
              <span
                className="rounded-full px-2.5 py-0.5 text-sm font-medium"
                style={{ backgroundColor: category.color, color: readableTextColor(category.color) }}
              >
                {category.name}
              </span>
              <span className="flex-1" />
              <span className="text-sm text-ink-soft">{category.conversationCount ?? 0} conversa(s)</span>
              <Button variant="outline" disabled={busy} onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => setDeleting(category)}>
                Excluir
              </Button>
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="marcadores" />}
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
          title={`Excluir marcador "${deleting.name}"?`}
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
              ? `Esse marcador está em ${deleting.conversationCount} conversa(s). Excluir vai remover a marcação dessas conversas.`
              : 'Esse marcador não está em nenhuma conversa no momento.'}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
