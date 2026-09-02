'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { ConversationWithMessages } from '@/features/admin/types/admin';

export default function ConversaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useApiClient();
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    apiFetch<ConversationWithMessages>(`/conversations/${id}`)
      .then((data) => {
        if (cancelled) return;
        setConversation(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar conversa');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiFetch, id]);

  return (
    <div>
      {isLoading && <p className="text-ink-soft">Carregando...</p>}
      {!isLoading && error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && conversation && (
        <>
          <h1 className="text-2xl font-semibold">{conversation.telefone}</h1>
          <p className="text-ink-soft">{conversation.nome ?? 'Nome não informado'}</p>
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
        </>
      )}
    </div>
  );
}
