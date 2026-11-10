'use client';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { FormField } from '@/features/admin/components/FormField';
import { PageHeader } from '@/features/admin/components/PageHeader';
import type { BotSettings } from '@/features/admin/types/admin';

type MessagesForm = Pick<
  BotSettings,
  'welcomeMessage' | 'invalidAttemptsExceededMessage' | 'mediaReceivedMessage' | 'orderReceivedMessage'
>;

const FIELDS: { name: keyof MessagesForm; label: string; hint: string }[] = [
  {
    name: 'welcomeMessage',
    label: 'Mensagem de boas-vindas',
    hint: 'Enviada assim que a conversa começa.',
  },
  {
    name: 'invalidAttemptsExceededMessage',
    label: 'Mensagem de escalonamento',
    hint: 'Enviada quando o cliente erra a opção do menu 3 vezes seguidas.',
  },
  {
    name: 'mediaReceivedMessage',
    label: 'Mensagem de conteúdo inválido',
    hint: 'Enviada quando o cliente manda áudio, figurinha, vídeo ou outro conteúdo que o bot não entende. O bot continua a conversa normalmente depois.',
  },
  {
    name: 'orderReceivedMessage',
    label: 'Mensagem de pedido pelo catálogo',
    hint: 'Enviada quando o cliente faz um pedido pelo catálogo do WhatsApp, antes de transferir para um atendente.',
  },
];

export default function MensagensPage() {
  const { apiFetch } = useApiClient();
  const { data, isLoading, error } = useApiResource<MessagesForm>('/bot-settings');
  const save = useApiMutation('Erro ao salvar as mensagens.');
  const [form, setForm] = useState<MessagesForm | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaved(false);
    const ok = await save.run(() => apiFetch('/bot-settings', { method: 'PATCH', body: JSON.stringify(form) }));
    if (ok) setSaved(true);
  }

  if (isLoading) return <LoadingState />;
  if (!form) return <ErrorAlert>{error ?? 'Não foi possível carregar as mensagens.'}</ErrorAlert>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <PageHeader title="Mensagens" />

      {FIELDS.map(({ name, label, hint }) => (
        <FormField key={name} id={name} label={label} hint={hint}>
          <Textarea
            id={name}
            value={form[name]}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, [name]: e.target.value });
            }}
          />
        </FormField>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={save.isPending} loadingText="Salvando...">
          Salvar
        </Button>
        {saved && (
          <p role="status" className="text-sm text-moss">
            Mensagens salvas.
          </p>
        )}
      </div>
      {save.error && <ErrorText>{save.error}</ErrorText>}
    </form>
  );
}
