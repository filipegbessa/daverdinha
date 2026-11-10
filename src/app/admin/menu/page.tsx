'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { MenuItemDialog } from '@/features/admin/components/MenuItemDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { MenuItem } from '@/features/admin/types/admin';

export default function MenuPage() {
  const { apiFetch } = useApiClient();
  const { data: items, isLoading, isRefreshing, error, refetch } = useApiResource<MenuItem[]>('/menu-items');
  const mutation = useApiMutation('Erro ao atualizar item de menu.');
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);

  // A move/toggle in flight and the reload after it both dim the list.
  const busy = mutation.isPending || isRefreshing;

  async function mutate(action: () => Promise<unknown>) {
    const ok = await mutation.run(action);
    if (ok) refetch();
    return ok;
  }

  function toggleActive(item: MenuItem) {
    return mutate(() =>
      apiFetch(`/menu-items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) }),
    );
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await mutate(() => apiFetch(`/menu-items/${deleting.id}`, { method: 'DELETE' }));
    if (ok) setDeleting(null);
  }

  function move(item: MenuItem, direction: 'up' | 'down') {
    if (!items) return;
    const index = items.findIndex((i) => i.id === item.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

    return mutate(() =>
      apiFetch('/menu-items/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
      }),
    );
  }

  return (
    <div>
      <PageHeader title="Menu">
        <Button onClick={() => setEditing('new')} disabled={!items}>
          Novo item
        </Button>
      </PageHeader>
      {isLoading && <LoadingState />}
      {!isLoading && !items && <ErrorAlert>{error ?? 'Não foi possível carregar os itens de menu.'}</ErrorAlert>}
      {mutation.error && <ErrorAlert>{mutation.error}</ErrorAlert>}
      {items && (
        <AdminList busy={busy} isEmpty={items.length === 0} empty="Nenhum item de menu.">
          {items.map((item, index) => (
            <AdminListItem key={item.id}>
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Mover ${item.topic} pra cima`}
                  disabled={busy || index === 0}
                  onClick={() => move(item, 'up')}
                >
                  <ChevronUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Mover ${item.topic} pra baixo`}
                  disabled={busy || index === items.length - 1}
                  onClick={() => move(item, 'down')}
                >
                  <ChevronDown aria-hidden="true" />
                </Button>
              </div>
              <span className="flex-1">{item.topic}</span>
              <Switch
                checked={item.active}
                onCheckedChange={() => toggleActive(item)}
                disabled={busy}
                aria-label={`Ativar ${item.topic}`}
              />
              <Button variant="outline" disabled={busy} onClick={() => setEditing(item)}>
                Editar
              </Button>
              {!item.isSystem && (
                <Button variant="destructive" disabled={busy} onClick={() => setDeleting(item)}>
                  Excluir
                </Button>
              )}
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {editing && (
        <MenuItemDialog
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir o item "${deleting.topic}"?`}
          isPending={mutation.isPending}
          error={mutation.error}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleting(null);
            mutation.clearError();
          }}
        >
          <p>Esse item some do menu que o cliente vê no WhatsApp. Não dá pra desfazer.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
