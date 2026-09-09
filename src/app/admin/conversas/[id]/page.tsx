'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { formatPhone } from '@/features/admin/lib/format-phone';
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

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // Scroll to the latest message on load and whenever the message count
    // changes (a reply just sent, or a new one arriving via poll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.messages.length]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setSavingName(true);
    try {
      await apiFetch(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      setEditingName(false);
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

  if (isLoading) {
    return <p className="text-ink-soft">Carregando...</p>;
  }

  if (error && !conversation) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-wrap items-start justify-between gap-4 border-b border-sand-line pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{conversation.name || formatPhone(conversation.phone)}</h1>
          {!editingName && (
            <div className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
              {conversation.name && <span>{formatPhone(conversation.phone)}</span>}
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="underline underline-offset-4 hover:text-ink"
              >
                {conversation.name ? 'editar nome' : '+ adicionar nome'}
              </button>
            </div>
          )}
          {editingName && (
            <form onSubmit={handleSaveName} className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor="contactName" className="sr-only">
                Nome
              </label>
              <Input
                id="contactName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do cliente"
                autoFocus
              />
              <Button type="submit" disabled={savingName}>
                Salvar nome
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingName(false)}>
                Cancelar
              </Button>
            </form>
          )}
        </div>
        {conversation.status === 'paused_human' ? (
          <Button variant="outline" onClick={handleReactivate} disabled={reactivating}>
            Reativar bot
          </Button>
        ) : (
          <Button variant="outline" onClick={handlePause} disabled={pausing}>
            Pausar bot
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 flex-none text-red-600">
          {error}
        </p>
      )}

      <div ref={messagesRef} className="my-4 flex-1 space-y-2 overflow-y-auto">
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

      <div className="flex-none border-t border-sand-line pt-3">
        {conversation.status === 'paused_human' ? (
          <form onSubmit={handleReply} className="flex items-end gap-2">
            <label htmlFor="replyText" className="sr-only">
              Responder
            </label>
            <Textarea
              id="replyText"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
              rows={2}
              className="flex-1"
            />
            <Button type="submit" disabled={sending}>
              Enviar
            </Button>
          </form>
        ) : (
          <p className="text-sm text-ink-soft">O bot está respondendo essa conversa automaticamente.</p>
        )}
        {actionError && (
          <p role="alert" className="mt-2 text-red-600">
            {actionError}
          </p>
        )}
      </div>
    </div>
  );
}
