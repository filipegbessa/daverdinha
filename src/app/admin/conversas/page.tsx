'use client';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
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
  const { data, isLoading, error } = useApiResource<Conversation[]>('/conversations');
  const conversations = data ?? [];

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
                    {conversation.phone}
                  </Link>
                </TableCell>
                <TableCell>{conversation.name ?? '—'}</TableCell>
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
