'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField } from '@/features/admin/components/FormField';
import type { MenuItem } from '@/features/admin/types/admin';

// WhatsApp's interactive list message rejects the whole request if any row
// title is longer than this (error #131009) — capping input here keeps a
// too-long topic from silently breaking the bot's menu for every customer.
const TOPIC_MAX_LENGTH = 24;

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
  const save = useApiMutation('Erro ao salvar item de menu.');

  async function handleSubmit() {
    const payload = isSystem
      ? { topic, deliveryPrompt, deliveryConfirmedMessage, deliveryNotCoveredMessage, deliveryUnrecognizedMessage }
      : { topic, reply };

    const ok = await save.run(() =>
      item
        ? apiFetch(`/menu-items/${item.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : // `order: 999` parks a new item at the end; the backend renumbers
          // the whole list on the next reorder.
          apiFetch('/menu-items', { method: 'POST', body: JSON.stringify({ ...payload, order: 999 }) }),
    );
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={item ? 'Editar item' : 'Novo item de menu'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="topic" label="Tema" hint={`${topic.length}/${TOPIC_MAX_LENGTH}`}>
        <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={TOPIC_MAX_LENGTH} required />
      </FormField>

      {isSystem ? (
        <>
          <FormField
            id="deliveryPrompt"
            label="Pergunta inicial"
            hint="Enviada quando o cliente escolhe esse item, perguntando o bairro."
          >
            <Textarea id="deliveryPrompt" value={deliveryPrompt} onChange={(e) => setDeliveryPrompt(e.target.value)} required />
          </FormField>
          <FormField
            id="deliveryConfirmedMessage"
            label="Mensagem de confirmação de entrega"
            hint="Enviada quando o bairro informado é atendido."
          >
            <Textarea
              id="deliveryConfirmedMessage"
              value={deliveryConfirmedMessage}
              onChange={(e) => setDeliveryConfirmedMessage(e.target.value)}
              required
            />
          </FormField>
          <FormField
            id="deliveryNotCoveredMessage"
            label="Mensagem de região não atendida"
            hint="Enviada quando o bairro informado não é atendido."
          >
            <Textarea
              id="deliveryNotCoveredMessage"
              value={deliveryNotCoveredMessage}
              onChange={(e) => setDeliveryNotCoveredMessage(e.target.value)}
              required
            />
          </FormField>
          <FormField
            id="deliveryUnrecognizedMessage"
            label="Mensagem quando não reconhece o bairro"
            hint="Enviada quando o bot não consegue identificar o texto como um bairro."
          >
            <Textarea
              id="deliveryUnrecognizedMessage"
              value={deliveryUnrecognizedMessage}
              onChange={(e) => setDeliveryUnrecognizedMessage(e.target.value)}
              required
            />
          </FormField>
        </>
      ) : (
        <FormField id="reply" label="Resposta">
          <Textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} required />
        </FormField>
      )}
    </FormDialog>
  );
}
