'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { MenuItem } from '@/features/admin/types/admin';

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
  const isSystem = item?.isSystem ?? false;
  const [topic, setTopic] = useState(item?.topic ?? '');
  const [reply, setReply] = useState(item?.reply ?? '');
  const [deliveryPrompt, setDeliveryPrompt] = useState(item?.deliveryPrompt ?? '');
  const [deliveryConfirmedMessage, setDeliveryConfirmedMessage] = useState(
    item?.deliveryConfirmedMessage ?? '',
  );
  const [deliveryNotCoveredMessage, setDeliveryNotCoveredMessage] = useState(
    item?.deliveryNotCoveredMessage ?? '',
  );
  const [deliveryUnrecognizedMessage, setDeliveryUnrecognizedMessage] = useState(
    item?.deliveryUnrecognizedMessage ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = isSystem
      ? {
          topic,
          deliveryPrompt,
          deliveryConfirmedMessage,
          deliveryNotCoveredMessage,
          deliveryUnrecognizedMessage,
        }
      : item
        ? { topic, reply }
        : { topic, type: 'texto' as const, reply };

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

          {isSystem ? (
            <>
              <div>
                <label htmlFor="deliveryPrompt" className="block font-medium">
                  Pergunta inicial
                </label>
                <p className="text-sm text-muted-foreground">
                  Enviada quando o cliente escolhe esse item, perguntando o bairro.
                </p>
                <Textarea
                  id="deliveryPrompt"
                  value={deliveryPrompt}
                  onChange={(e) => setDeliveryPrompt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="deliveryConfirmedMessage" className="block font-medium">
                  Mensagem de confirmação de entrega
                </label>
                <p className="text-sm text-muted-foreground">
                  Enviada quando o bairro informado é atendido.
                </p>
                <Textarea
                  id="deliveryConfirmedMessage"
                  value={deliveryConfirmedMessage}
                  onChange={(e) => setDeliveryConfirmedMessage(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="deliveryNotCoveredMessage" className="block font-medium">
                  Mensagem de região não atendida
                </label>
                <p className="text-sm text-muted-foreground">
                  Enviada quando o bairro informado não é atendido.
                </p>
                <Textarea
                  id="deliveryNotCoveredMessage"
                  value={deliveryNotCoveredMessage}
                  onChange={(e) => setDeliveryNotCoveredMessage(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="deliveryUnrecognizedMessage" className="block font-medium">
                  Mensagem quando não reconhece o bairro
                </label>
                <p className="text-sm text-muted-foreground">
                  Enviada quando o bot não consegue identificar o texto como um bairro.
                </p>
                <Textarea
                  id="deliveryUnrecognizedMessage"
                  value={deliveryUnrecognizedMessage}
                  onChange={(e) => setDeliveryUnrecognizedMessage(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="reply" className="block font-medium">
                Resposta
              </label>
              <Textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} required />
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
