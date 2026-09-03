'use client';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { BotSettings } from '@/features/admin/types/admin';

type MessagesForm = Pick<BotSettings, 'welcomeMessage' | 'deliveryPrompt' | 'deliveryWaitMessage'>;

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
        <Textarea
          id="welcomeMessage"
          value={form.welcomeMessage}
          onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="deliveryPrompt" className="block font-medium">
          Pergunta de endereço de entrega
        </label>
        <Textarea
          id="deliveryPrompt"
          value={form.deliveryPrompt}
          onChange={(e) => setForm({ ...form, deliveryPrompt: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="deliveryWaitMessage" className="block font-medium">
          Mensagem de espera
        </label>
        <Textarea
          id="deliveryWaitMessage"
          value={form.deliveryWaitMessage}
          onChange={(e) => setForm({ ...form, deliveryWaitMessage: e.target.value })}
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
