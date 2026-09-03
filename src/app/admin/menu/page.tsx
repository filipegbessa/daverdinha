'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { MenuItemDialog } from '@/features/admin/components/MenuItemDialog';
import type { MenuItem } from '@/features/admin/types/admin';

export default function MenuPage() {
  const { apiFetch } = useApiClient();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return apiFetch<MenuItem[]>('/menu-items')
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os itens de menu.');
      });
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: MenuItem) {
    setError(null);
    try {
      await apiFetch(`/menu-items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item de menu.');
    }
  }

  async function remove(item: MenuItem) {
    setError(null);
    try {
      await apiFetch(`/menu-items/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item de menu.');
    }
  }

  async function move(item: MenuItem, direction: 'up' | 'down') {
    if (!items) return;
    const index = items.findIndex((i) => i.id === item.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

    setError(null);
    try {
      await apiFetch('/menu-items/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reordenar itens de menu.');
    }
  }

  if (!items) {
    return error ? (
      <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
        {error}
      </p>
    ) : (
      <p>Carregando...</p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <Button onClick={() => setEditing('new')}>Novo item</Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
          {error}
        </p>
      )}
      <ul className="mt-6 space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 rounded border border-sand-line p-3">
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Mover ${item.topic} pra cima`}
                disabled={index === 0}
                onClick={() => move(item, 'up')}
              >
                ▲
              </button>
              <button
                type="button"
                aria-label={`Mover ${item.topic} pra baixo`}
                disabled={index === items.length - 1}
                onClick={() => move(item, 'down')}
              >
                ▼
              </button>
            </div>
            <span className="flex-1">{item.topic}</span>
            <Switch checked={item.active} onCheckedChange={() => toggleActive(item)} aria-label={`Ativar ${item.topic}`} />
            <Button variant="outline" onClick={() => setEditing(item)}>
              Editar
            </Button>
            <Button variant="destructive" onClick={() => remove(item)}>
              Excluir
            </Button>
          </li>
        ))}
      </ul>
      {editing && (
        <MenuItemDialog
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
