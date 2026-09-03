'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { MenuItem, MenuItemType } from '@/features/admin/types/admin';

export function MenuItemDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const [topic, setTopic] = useState(item?.topic ?? '');
  const [type, setType] = useState<MenuItemType>(item?.type ?? 'texto');
  const [reply, setReply] = useState(item?.reply ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = { topic, type, reply: type === 'texto' ? reply : null };

    try {
      if (item) {
        await apiFetch(`/menu-items/${item.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/menu-items', { method: 'POST', body: JSON.stringify({ ...payload, order: 999 }) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item de menu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Editar item' : 'Novo item de menu'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block font-medium">
              Tema
            </label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="type" className="block font-medium">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as MenuItemType)}
              className="w-full rounded border border-sand-line p-2"
            >
              <option value="texto">Texto</option>
              <option value="entrega">Locais de entrega</option>
              <option value="atendente">Falar com atendente</option>
            </select>
          </div>
          {type === 'texto' && (
            <div>
              <label htmlFor="reply" className="block font-medium">
                Resposta
              </label>
              <Textarea id="reply" value={reply ?? ''} onChange={(e) => setReply(e.target.value)} required />
            </div>
          )}
          <Button type="submit" disabled={saving}>
            Salvar
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-berry">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
