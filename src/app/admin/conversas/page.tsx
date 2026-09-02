'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { Conversation } from '@/features/admin/types/admin';

const STATUS_LABEL: Record<Conversation['status'], string> = {
  bot_active: 'Bot ativo',
  paused_human: 'Transferida',
};

const ENTRY_POINT_LABEL: Record<string, string> = {
  menu: 'Menu',
  catalog: 'Catálogo',
};

export default function ConversasPage() {
  const { apiFetch } = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    apiFetch<Conversation[]>('/conversations')
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar conversas');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Conversas</h1>
      {isLoading && <p className="mt-6 text-ink-soft">Carregando...</p>}
      {!isLoading && error && <p className="mt-6 text-red-600">{error}</p>}
      {!isLoading && !error && (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Telefone</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  <Link href={`/admin/conversas/${conversation.id}`} className="underline underline-offset-4">
                    {conversation.telefone}
                  </Link>
                </TableCell>
                <TableCell>{conversation.nome ?? '—'}</TableCell>
                <TableCell>{STATUS_LABEL[conversation.status]}</TableCell>
                <TableCell>{conversation.entryPoint ? ENTRY_POINT_LABEL[conversation.entryPoint] : '—'}</TableCell>
                <TableCell>{new Date(conversation.updatedAt).toLocaleString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
