'use client';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { BotSettings } from '@/features/admin/types/admin';

type MessagesForm = Pick<
  BotSettings,
  'welcomeMessage' | 'invalidAttemptsExceededMessage' | 'mediaReceivedMessage' | 'orderReceivedMessage'
>;

export default function MensagensPage() {
  const { apiFetch } = useApiClient();
  const [form, setForm] = useState<MessagesForm | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MessagesForm>('/bot-settings')
      .then(setForm)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as mensagens.');
      });
  }, [apiFetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaved(false);
    setError(null);
    try {
      await apiFetch('/bot-settings', { method: 'PATCH', body: JSON.stringify(form) });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  if (!form) {
    return error ? (
      <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
        {error}
      </p>
    ) : (
      <p>Carregando...</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Mensagens</h1>

      <div>
        <label htmlFor="welcomeMessage" className="block font-medium">
          Mensagem de boas-vindas
        </label>
        <p className="text-sm text-muted-foreground">Enviada assim que a conversa começa.</p>
        <Textarea
          id="welcomeMessage"
          value={form.welcomeMessage}
          onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="invalidAttemptsExceededMessage" className="block font-medium">
          Mensagem de escalonamento
        </label>
        <p className="text-sm text-muted-foreground">
          Enviada quando o cliente erra a opção do menu 3 vezes seguidas.
        </p>
        <Textarea
          id="invalidAttemptsExceededMessage"
          value={form.invalidAttemptsExceededMessage}
          onChange={(e) => setForm({ ...form, invalidAttemptsExceededMessage: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="mediaReceivedMessage" className="block font-medium">
          Mensagem de conteúdo inválido
        </label>
        <p className="text-sm text-muted-foreground">
          Enviada quando o cliente manda áudio, figurinha, vídeo ou outro conteúdo que o bot não entende. O bot
          continua a conversa normalmente depois.
        </p>
        <Textarea
          id="mediaReceivedMessage"
          value={form.mediaReceivedMessage}
          onChange={(e) => setForm({ ...form, mediaReceivedMessage: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="orderReceivedMessage" className="block font-medium">
          Mensagem de pedido pelo catálogo
        </label>
        <p className="text-sm text-muted-foreground">
          Enviada quando o cliente faz um pedido pelo catálogo do WhatsApp, antes de transferir para um
          atendente.
        </p>
        <Textarea
          id="orderReceivedMessage"
          value={form.orderReceivedMessage}
          onChange={(e) => setForm({ ...form, orderReceivedMessage: e.target.value })}
        />
      </div>

      <Button type="submit">Salvar</Button>
      {saved && <p role="status">Salvo!</p>}
      {error && (
        <p role="alert" className="mt-2 text-berry">
          {error}
        </p>
      )}
    </form>
  );
}
