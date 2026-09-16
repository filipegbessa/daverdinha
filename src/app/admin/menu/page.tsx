'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { MenuItemDialog } from '@/features/admin/components/MenuItemDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { MenuItem } from '@/features/admin/types/admin';

export default function MenuPage() {
  const { apiFetch } = useApiClient();
  const { data: items, isLoading, error, refetch } = useApiResource<MenuItem[]>('/menu-items');
  const mutation = useApiMutation('Erro ao atualizar item de menu.');
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);

  const busy = mutation.isPending;

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

  if (isLoading) return <LoadingState />;
  if (!items) return <ErrorAlert>{error ?? 'Não foi possível carregar os itens de menu.'}</ErrorAlert>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <Button onClick={() => setEditing('new')}>Novo item</Button>
      </div>
      {mutation.error && <ErrorAlert>{mutation.error}</ErrorAlert>}
      <ul className={`mt-6 space-y-2 ${busy ? 'cursor-wait opacity-50' : ''}`} aria-busy={busy}>
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 rounded border border-sand-line p-3">
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Mover ${item.topic} pra cima`}
                disabled={busy || index === 0}
                onClick={() => move(item, 'up')}
              >
                ▲
              </button>
              <button
                type="button"
                aria-label={`Mover ${item.topic} pra baixo`}
                disabled={busy || index === items.length - 1}
                onClick={() => move(item, 'down')}
              >
                ▼
              </button>
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
          </li>
        ))}
      </ul>
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
