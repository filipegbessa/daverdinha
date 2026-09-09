'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { formatPhone } from '@/features/admin/lib/format-phone';
import type { Conversation } from '@/features/admin/types/admin';

const STATUS_LABEL: Record<Conversation['status'], string> = {
  bot_active: 'Bot ativo',
  paused_human: 'Transferida',
};

const ENTRY_POINT_LABEL: Record<string, string> = {
  menu: 'Menu',
  catalog: 'Catálogo',
};

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function ConversasPage() {
  const { data, isLoading, error } = useApiResource<Conversation[]>('/conversations', { pollIntervalMs: 10000 });
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const conversations = data ?? [];

  const filtered = useMemo(() => {
    const query = normalizeSearch(search.trim());
    return conversations.filter((conversation) => {
      if (onlyUnread && !conversation.unread) return false;
      if (!query) return true;
      const haystack = `${normalizeSearch(conversation.name ?? '')} ${conversation.phone}`;
      return haystack.includes(query);
    });
  }, [conversations, search, onlyUnread]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            aria-label="Buscar conversas"
            className="w-64"
          />
          <Button
            type="button"
            variant="outline"
            aria-pressed={onlyUnread}
            onClick={() => setOnlyUnread((value) => !value)}
            className={onlyUnread ? 'border-moss bg-moss/10' : ''}
          >
            Não lidas
          </Button>
        </div>
      </div>
      {isLoading && <p className="mt-6 text-ink-soft">Carregando...</p>}
      {!isLoading && error && <p className="mt-6 text-red-600">{error}</p>}
      {!isLoading && !error && (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  <Link
                    href={`/admin/conversas/${conversation.id}`}
                    className="flex items-center gap-2 underline underline-offset-4"
                  >
                    {conversation.unread && (
                      <span title="Não lida" className="h-2 w-2 flex-none rounded-full bg-berry" />
                    )}
                    {conversation.name ?? formatPhone(conversation.phone)}
                  </Link>
                </TableCell>
                <TableCell>{formatPhone(conversation.phone)}</TableCell>
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
