'use client';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import type { ConversationWithMessages } from '@/features/admin/types/admin';

export default function ConversaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: conversation,
    isLoading,
    error,
  } = useApiResource<ConversationWithMessages>(`/conversations/${id}`);

  return (
    <div>
      {isLoading && <p className="text-ink-soft">Carregando...</p>}
      {!isLoading && error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && conversation && (
        <>
          <h1 className="text-2xl font-semibold">{conversation.phone}</h1>
          <p className="text-ink-soft">{conversation.name ?? 'Nome não informado'}</p>
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
