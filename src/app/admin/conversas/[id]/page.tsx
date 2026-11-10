'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { BackLink } from '@/features/admin/components/BackLink';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CornerUpLeft, Loader2, Mic, Paperclip, Plus, ShoppingCart, X, type LucideIcon } from 'lucide-react';
import { useApiClient } from '@/features/admin/lib/api-client';
import { MessageImage } from '@/features/admin/components/MessageImage';
import { MessageAudio } from '@/features/admin/components/MessageAudio';
import { ACCEPTED_REPLY_TYPES, classifyReplyFile, type ReplyAttachment } from '@/features/admin/lib/reply-media';
import { useVoiceRecorder } from '@/features/admin/lib/use-voice-recorder';
import { pauseOtherAudio } from '@/features/admin/lib/exclusive-audio-playback';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useConversationMessages } from '@/features/admin/lib/use-conversation-messages';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { badgeColorStyle, badgeVariants, ColorDot } from '@/features/admin/components/Badge';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/features/admin/lib/format-phone';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Category, ConversationWithMessages, Paginated } from '@/features/admin/types/admin';

/** Truncates a quoted message preview to `max` characters, appending an ellipsis when it cuts. */
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

type QuotedMessage = { kind?: string; body: string | null };

/**
 * O que aparece no lugar de uma mensagem citada sem texto: uma foto sem
 * legenda ou um áudio não têm mais nada pra mostrar.
 */
function QuotePreview({ message, max }: { message: QuotedMessage; max: number }) {
  if (message.body) return <>{truncate(message.body, max)}</>;
  if (message.kind === 'audio') return <IconText icon={Mic}>Áudio</IconText>;
  if (message.kind === 'image') return <IconText icon={Camera}>Foto</IconText>;
  return <>(mensagem sem texto)</>;
}

/** Um ícone pequeno antes do texto, alinhado com a linha. */
function IconText({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon aria-hidden="true" className="size-3.5 flex-none" />
      {children}
    </span>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Lets the operator listen to what they're about to send. The object URL is
 * revoked when the attachment changes — otherwise every recording discarded
 * would stay pinned in memory until the tab closes.
 */
function AttachmentAudioPreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    // jsdom (and very old browsers) have no object URLs; the name alone is enough there.
    if (typeof URL.createObjectURL !== 'function') return;
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return src ? (
    <audio src={src} controls className="mt-1 max-w-full" onPlay={(e) => pauseOtherAudio(e.currentTarget)} />
  ) : null;
}

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
  const categoryChange = useApiMutation('Erro ao atualizar marcador.');

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<(QuotedMessage & { id: string }) | null>(null);
  const [attachment, setAttachment] = useState<ReplyAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const recorder = useVoiceRecorder((file) => {
    setAttachmentError(null);
    setAttachment({ kind: 'audio', file });
  });
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

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Limpa o input para o mesmo arquivo poder ser escolhido de novo depois
    // de um erro — sem isso o `change` não dispara na segunda vez.
    e.target.value = '';
    if (!file) return;

    const result = classifyReplyFile(file);
    if ('error' in result) {
      setAttachment(null);
      setAttachmentError(result.error);
      return;
    }
    setAttachmentError(null);
    setAttachment(result);
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();

    // Com imagem, o texto vira legenda — é uma mensagem só, não duas. Áudio
    // não aceita legenda no WhatsApp, então o texto digitado fica no campo
    // para ser enviado depois, em vez de sumir.
    const request = attachment
      ? () => {
          const form = new FormData();
          form.append('file', attachment.file);
          if (attachment.kind === 'image' && replyText) form.append('caption', replyText);
          if (replyingTo) form.append('replyToMessageId', replyingTo.id);
          return apiFetch(`/conversations/${id}/reply-${attachment.kind}`, {
            method: 'POST',
            body: form,
          });
        }
      : () =>
          apiFetch(`/conversations/${id}/reply`, {
            method: 'POST',
            body: JSON.stringify({ text: replyText, replyToMessageId: replyingTo?.id }),
          });

    const ok = await sendReply.run(request);
    if (ok) {
      if (attachment?.kind !== 'audio') setReplyText('');
      setReplyingTo(null);
      setAttachment(null);
      setAttachmentError(null);
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

  // O título aparece sempre; o carregando ou o erro ficam embaixo dele.
  if (!conversation) {
    return (
      <div>
        <BackLink href="/admin/conversas">Voltar para conversas</BackLink>
        <PageHeader title="Conversa" />
        {isLoading || !error ? <LoadingState /> : <ErrorAlert>{error}</ErrorAlert>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BackLink href="/admin/conversas">Voltar para conversas</BackLink>
      <div className="flex-none border-b border-border pb-4">
        <PageHeader
          title={conversation.name || formatPhone(conversation.phone)}
          description={
            <>
              {!editingName && (
                <div className="flex items-center gap-2">
                  {conversation.name && <span>{formatPhone(conversation.phone)}</span>}
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {conversation.name ? 'editar nome' : <IconText icon={Plus}>adicionar nome</IconText>}
                  </button>
                </div>
              )}
              {editingName && (
                <form onSubmit={handleSaveName} className="mt-2 flex flex-wrap items-center gap-2 text-foreground">
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
                  <Button type="submit" loading={saveName.isPending}>
                    Salvar nome
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingName(false)}>
                    Cancelar
                  </Button>
                </form>
              )}
            </>
          }
        >
          {conversation.status === 'paused_human' ? (
            <Button variant="outline" onClick={() => handleBotState('reactivate')} loading={botState.isPending}>
              Reativar bot
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleBotState('pause')} loading={botState.isPending}>
              Pausar bot
            </Button>
          )}
        </PageHeader>
      </div>

      {error && <ErrorText className="flex-none">{error}</ErrorText>}

      {allCategories && allCategories.length > 0 && (
        <div className="flex flex-none flex-wrap items-center gap-2 border-b border-border py-3">
          {conversation.categories.map((cat) => {
            const isPending = pendingCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id, true)}
                disabled={isPending}
                aria-busy={isPending}
                title="Remover marcador"
                className={cn(badgeVariants(), isPending && 'cursor-wait opacity-50')}
                style={badgeColorStyle(cat.color)}
              >
                {cat.name}
                {isPending ? (
                  <Loader2 aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                ) : (
                  <X aria-hidden="true" className="size-3.5" />
                )}
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
              <Plus aria-hidden="true" />
              Marcador
            </Button>
            {categoryMenuOpen && (
              <div
                role="menu"
                aria-label="Adicionar marcador"
                className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-background p-1 shadow-md"
              >
                {(() => {
                  const available = allCategories.filter(
                    (cat) => !conversation.categories.some((c) => c.id === cat.id),
                  );
                  if (available.length === 0) {
                    return <p className="px-2 py-1.5 text-sm text-muted-foreground">Todas já adicionadas.</p>;
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
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
                          isPending ? 'cursor-wait opacity-50' : ''
                        }`}
                      >
                        <ColorDot color={cat.color} />
                        {cat.name}
                        {isPending && (
                          <Loader2 aria-hidden="true" className="ml-auto size-3.5 motion-safe:animate-spin" />
                        )}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadOlder}
              loading={isLoadingOlder}
              loadingText="Carregando..."
            >
              Carregar mensagens anteriores
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
                  ? 'max-w-md rounded border-2 border-primary/60 bg-muted p-3 group'
                  : message.direction === 'inbound'
                    ? `max-w-md rounded bg-muted p-3${kind === 'invalid_content' ? ' italic text-muted-foreground' : ''} group`
                    : 'ml-auto max-w-md rounded bg-primary/10 p-3 text-right group'
              }
            >
              {message.repliedTo ? (
                <p
                  data-testid="reply-quote"
                  className="mb-1 border-l-2 border-muted-foreground/40 pl-2 text-xs text-muted-foreground"
                >
                  <QuotePreview message={message.repliedTo} max={80} />
                </p>
              ) : (
                message.repliedToWamid && (
                  <p
                    data-testid="reply-quote-generic"
                    className="mb-1 border-l-2 border-muted-foreground/40 pl-2 text-xs text-muted-foreground"
                  >
                    <IconText icon={CornerUpLeft}>Respondendo a uma mensagem anterior</IconText>
                  </p>
                )
              )}
              {kind === 'order' && (
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  <IconText icon={ShoppingCart}>Pedido pelo catálogo</IconText>
                </p>
              )}
              {kind === 'image' ? (
                <MessageImage conversationId={id} messageId={message.id} caption={message.body} />
              ) : kind === 'audio' ? (
                <MessageAudio conversationId={id} messageId={message.id} />
              ) : kind === 'order' && message.order && message.order.items.length > 0 ? (
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
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
                {message.whatsappMessageId && (
                  <button
                    type="button"
                    data-testid="reply-to-button"
                    onClick={() => setReplyingTo({ id: message.id, kind: message.kind, body: message.body })}
                    className="text-xs text-muted-foreground underline opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    <IconText icon={CornerUpLeft}>responder</IconText>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-none border-t border-border pt-3">
        {conversation.status === 'paused_human' ? (
          <form onSubmit={handleReply}>
            {replyingTo && (
              <div
                data-testid="replying-to-banner"
                className="mb-2 flex items-center justify-between gap-2 border-l-2 border-primary pl-2 text-xs text-muted-foreground"
              >
                <span>
                  Respondendo a: <QuotePreview message={replyingTo} max={60} />
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancelar resposta citada"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            )}
            {attachment && (
              <div
                data-testid="attachment-preview"
                className="mb-2 flex items-center justify-between gap-2 rounded border border-border p-2 text-xs text-muted-foreground"
              >
                <div className="min-w-0 flex-1">
                  <IconText icon={attachment.kind === 'audio' ? Mic : Paperclip}>{attachment.file.name}</IconText>
                  {attachment.kind === 'audio' && <AttachmentAudioPreview file={attachment.file} />}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setAttachment(null)}
                  aria-label="Remover anexo"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            )}
            {recorder.state === 'recording' && (
              <div
                data-testid="recording-banner"
                className="mb-2 flex items-center justify-between gap-2 rounded border border-destructive/40 p-2 text-xs text-destructive"
              >
                <span aria-live="polite">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full bg-destructive motion-safe:animate-pulse"
                  />{' '}
                  Gravando {formatDuration(recorder.elapsedSeconds)}
                </span>
                <span className="flex gap-3">
                  <button type="button" onClick={recorder.cancel} className="underline">
                    Descartar
                  </button>
                  <button type="button" onClick={recorder.stop} className="font-semibold underline">
                    Parar
                  </button>
                </span>
              </div>
            )}
            {(attachmentError ?? recorder.error) && (
              <p role="alert" className="mb-2 text-xs text-destructive">
                {attachmentError ?? recorder.error}
              </p>
            )}
            <div className="flex items-end gap-2">
              {/* O próprio label é o gatilho: abre o seletor nativamente,
                  sem JS, e evita ter dois controles anunciando a mesma coisa
                  para leitor de tela. */}
              <label htmlFor="replyImage" className={buttonVariants({ variant: 'outline', size: 'icon' })}>
                <Paperclip aria-hidden="true" />
                <span className="sr-only">Anexar imagem ou áudio</span>
              </label>
              <input
                id="replyImage"
                type="file"
                accept={ACCEPTED_REPLY_TYPES}
                onChange={handleAttach}
                className="hidden"
              />
              {/* Só aparece onde o navegador grava num formato que o WhatsApp
                  aceita — no Chrome antigo, que só grava webm, o operador
                  ainda pode anexar um arquivo de áudio pelo clipe. */}
              {recorder.supported && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void recorder.start()}
                  disabled={recorder.state === 'recording' || sendReply.isPending}
                >
                  <Mic aria-hidden="true" />
                  <span className="sr-only">Gravar áudio</span>
                </Button>
              )}
              <label htmlFor="replyText" className="sr-only">
                Responder
              </label>
              <Textarea
                id="replyText"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                // Com anexo, o texto é opcional: a mídia já é a mensagem. Com
                // áudio ele nem vai junto — o WhatsApp não aceita legenda.
                required={!attachment}
                disabled={attachment?.kind === 'audio'}
                placeholder={
                  attachment?.kind === 'audio'
                    ? 'Áudio não leva legenda'
                    : attachment
                      ? 'Legenda (opcional)'
                      : undefined
                }
                rows={2}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={recorder.state === 'recording'}
                loading={sendReply.isPending}
                loadingText="Enviando..."
              >
                Enviar
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">O bot está respondendo essa conversa automaticamente.</p>
        )}
        {actionError && <ErrorText>{actionError}</ErrorText>}
      </div>
    </div>
  );
}
