'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useConversationMessages } from '@/features/admin/lib/use-conversation-messages';
import { ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { readableTextColor } from '@/features/admin/lib/readable-text-color';
import { formatPhone } from '@/features/admin/lib/format-phone';
import { formatCurrency } from '@/features/admin/lib/format-currency';
import type { Category, ConversationWithMessages, Paginated } from '@/features/admin/types/admin';

export default function ConversaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useApiClient();
  const {
    data: conversation,
    isLoading,
    error,
    refetch,
    // The conversation row itself stays on a poll — it's one row, and it
    // carries status, name and categories. Its transcript does not: messages
    // arrive through a delta poll instead of being re-downloaded whole.
  } = useApiResource<ConversationWithMessages>(`/conversations/${id}`, { pollIntervalMs: 15000 });
  // Every category, not the first page — this is a tag picker.
  const { data: categoryData } = useApiResource<Paginated<Category>>('/categories?perPage=100');
  const allCategories = categoryData?.items;
  const { messages, hasMore, isLoadingOlder, loadOlder } = useConversationMessages(
    id,
    conversation?.messages ?? [],
    conversation?.hasMoreMessages ?? false,
  );

  // One mutation hook per control, so each button owns its own pending flag
  // and a failure surfaces next to what the operator actually clicked.
  const saveName = useApiMutation('Erro ao salvar o nome.');
  const sendReply = useApiMutation('Erro ao enviar resposta.');
  const botState = useApiMutation('Erro ao alterar o estado do bot.');
  const categoryChange = useApiMutation('Erro ao atualizar categoria.');

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [replyText, setReplyText] = useState('');
  const [pendingCategory, setPendingCategory] = useState<{ id: string; attach: boolean } | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!pendingCategory || !conversation) return;
    const isAttached = conversation.categories.some((c) => c.id === pendingCategory.id);
    if (isAttached === pendingCategory.attach) {
      setPendingCategory(null);
    }
  }, [conversation, pendingCategory]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen]);

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // Scroll to the latest message on load and whenever the message count
    // changes (a reply just sent, or a new one arriving via poll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const ok = await saveName.run(() =>
      apiFetch(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    );
    if (ok) {
      setEditingName(false);
      refetch();
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendReply.run(() =>
      apiFetch(`/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ text: replyText }) }),
    );
    if (ok) {
      setReplyText('');
      refetch();
    }
  }

  async function handleBotState(action: 'pause' | 'reactivate') {
    const ok = await botState.run(() => apiFetch(`/conversations/${id}/${action}`, { method: 'POST' }));
    if (ok) refetch();
  }

  async function handleToggleCategory(categoryId: string, attached: boolean) {
    // Stays pending until the effect below sees the refetched conversation
    // actually reflect the change — clearing it as soon as the POST/DELETE
    // resolves (before the list refreshes) let the chip look re-enabled for
    // the gap between the request finishing and the refetch landing.
    setPendingCategory({ id: categoryId, attach: !attached });
    const ok = await categoryChange.run(() =>
      apiFetch(`/conversations/${id}/categories/${categoryId}`, { method: attached ? 'DELETE' : 'POST' }),
    );
    if (ok) refetch();
    else setPendingCategory(null);
  }

  const actionError = saveName.error ?? sendReply.error ?? botState.error ?? categoryChange.error;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !conversation) {
    return <ErrorText>{error}</ErrorText>;
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
              <Button type="submit" disabled={saveName.isPending}>
                Salvar nome
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingName(false)}>
                Cancelar
              </Button>
            </form>
          )}
        </div>
        {conversation.status === 'paused_human' ? (
          <Button variant="outline" onClick={() => handleBotState('reactivate')} disabled={botState.isPending}>
            Reativar bot
          </Button>
        ) : (
          <Button variant="outline" onClick={() => handleBotState('pause')} disabled={botState.isPending}>
            Pausar bot
          </Button>
        )}
      </div>

      {error && <ErrorText className="flex-none">{error}</ErrorText>}

      {allCategories && allCategories.length > 0 && (
        <div className="flex flex-none flex-wrap items-center gap-2 border-b border-sand-line py-3">
          {conversation.categories.map((cat) => {
            const isPending = pendingCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id, true)}
                disabled={isPending}
                aria-busy={isPending}
                title="Remover categoria"
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                  isPending ? 'cursor-wait opacity-50' : ''
                }`}
                style={{ backgroundColor: cat.color, color: readableTextColor(cat.color) }}
              >
                {cat.name}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
          <div className="relative" ref={categoryMenuRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCategoryMenuOpen((open) => !open)}
              aria-expanded={categoryMenuOpen}
            >
              + Categoria
            </Button>
            {categoryMenuOpen && (
              <div
                role="menu"
                aria-label="Adicionar categoria"
                className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-sand-line bg-paper p-1 shadow-md"
              >
                {(() => {
                  const available = allCategories.filter(
                    (cat) => !conversation.categories.some((c) => c.id === cat.id),
                  );
                  if (available.length === 0) {
                    return <p className="px-2 py-1.5 text-sm text-ink-soft">Todas já adicionadas.</p>;
                  }
                  return available.map((cat) => {
                    const isPending = pendingCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleToggleCategory(cat.id, false)}
                        disabled={isPending}
                        aria-busy={isPending}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-sand ${
                          isPending ? 'cursor-wait opacity-50' : ''
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 flex-none rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={messagesRef} className="my-4 flex-1 space-y-2 overflow-y-auto">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button type="button" variant="outline" size="sm" onClick={loadOlder} disabled={isLoadingOlder}>
              {isLoadingOlder ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </Button>
          </div>
        )}
        {messages.map((message) => {
          const kind = message.kind ?? 'text';
          return (
            <div
              key={message.id}
              data-testid="message-bubble"
              data-message-kind={kind}
              className={
                kind === 'order'
                  ? 'max-w-md rounded border-2 border-amber-400 bg-amber-50 p-3'
                  : message.direction === 'inbound'
                    ? `max-w-md rounded bg-sand p-3${kind === 'invalid_content' ? ' italic text-ink-soft' : ''}`
                    : 'ml-auto max-w-md rounded bg-moss/10 p-3 text-right'
              }
            >
              {kind === 'order' && (
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  🛒 Pedido pelo catálogo
                </p>
              )}
              {kind === 'order' && message.order && message.order.items.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {message.order.items.map((item) => (
                    <li key={item.id}>
                      - {item.productName ?? item.productRetailerId} x{item.quantity}
                      {item.unitPrice && item.currency ? ` — ${formatCurrency(item.unitPrice, item.currency)}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={kind === 'order' ? 'mt-1 whitespace-pre-line' : undefined}>{message.body}</p>
              )}
              <p className="mt-1 text-xs text-ink-soft">{new Date(message.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          );
        })}
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
            <Button type="submit" disabled={sendReply.isPending}>
              Enviar
            </Button>
          </form>
        ) : (
          <p className="text-sm text-ink-soft">O bot está respondendo essa conversa automaticamente.</p>
        )}
        {actionError && <ErrorText>{actionError}</ErrorText>}
      </div>
    </div>
  );
}
