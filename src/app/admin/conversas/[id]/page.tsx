'use client';
import { useLayoutEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import type { ConversationWithMessages } from '@/features/admin/types/admin';

export default function ConversaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useApiClient();
  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useApiResource<ConversationWithMessages>(`/conversations/${id}`, { pollIntervalMs: 5000 });

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // useLayoutEffect (not useEffect): the sync must land in the same commit
  // as the render that shows the fetched conversation, so the input's value
  // is correct by the time any test (or the operator) can observe it —
  // useEffect's passive-effect flush is scheduled as a separate macrotask
  // and can visibly lag behind the DOM update that shows the rest of the page.
  useLayoutEffect(() => {
    setName(conversation?.name ?? '');
    // Re-sync only when the actual name VALUE changes, not on every poll
    // tick with an unchanged value — otherwise a background refresh would
    // stomp on an in-progress edit the operator hasn't saved yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.name]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setSavingName(true);
    try {
      await apiFetch(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao salvar o nome.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setSending(true);
    try {
      await apiFetch(`/conversations/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text: replyText }),
      });
      setReplyText('');
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao enviar resposta.');
    } finally {
      setSending(false);
    }
  }

  async function handlePause() {
    setActionError(null);
    setPausing(true);
    try {
      await apiFetch(`/conversations/${id}/pause`, { method: 'POST' });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao pausar o bot.');
    } finally {
      setPausing(false);
    }
  }

  async function handleReactivate() {
    setActionError(null);
    setReactivating(true);
    try {
      await apiFetch(`/conversations/${id}/reactivate`, { method: 'POST' });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao reativar o bot.');
    } finally {
      setReactivating(false);
    }
  }

  return (
    <div>
      {isLoading && <p className="text-ink-soft">Carregando...</p>}
      {!isLoading && error && !conversation && <p className="text-red-600">{error}</p>}
      {!isLoading && conversation && (
        <>
          <h1 className="text-2xl font-semibold">{conversation.phone}</h1>

          {error && (
            <p role="alert" className="mt-2 text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSaveName} className="mt-2 flex items-end gap-2">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium">
                Nome
              </label>
              <Input
                id="contactName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome não informado"
              />
            </div>
            <Button type="submit" variant="outline" disabled={savingName}>
              Salvar nome
            </Button>
          </form>

          {actionError && (
            <p role="alert" className="mt-2 text-red-600">
              {actionError}
            </p>
          )}

          <div className="mt-6 space-y-2">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                data-testid="message-bubble"
                className={
                  message.direction === 'inbound'
                    ? 'max-w-md rounded bg-sand p-3'
                    : 'ml-auto max-w-md rounded bg-moss/10 p-3 text-right'
                }
              >
                <p>{message.body}</p>
                <p className="mt-1 text-xs text-ink-soft">{new Date(message.createdAt).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {conversation.status === 'paused_human' ? (
              <>
                <form onSubmit={handleReply} className="space-y-2">
                  <label htmlFor="replyText" className="block font-medium">
                    Responder
                  </label>
                  <Textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={sending}>
                    Enviar
                  </Button>
                </form>
                <Button variant="outline" onClick={handleReactivate} disabled={reactivating}>
                  Reativar bot
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handlePause} disabled={pausing}>
                Pausar bot
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
