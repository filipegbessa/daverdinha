'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BusyRegion } from '@/features/admin/components/AdminList';
import { DataTable, type DataTableColumn } from '@/features/admin/components/DataTable';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatPhone } from '@/features/admin/lib/format-phone';
import type { Category, Conversation, ConversationList, Paginated } from '@/features/admin/types/admin';

const STATUS_LABEL: Record<Conversation['status'], string> = {
  bot_active: 'Bot ativo',
  paused_human: 'Transferida',
};

const ENTRY_POINT_LABEL: Record<string, string> = {
  menu: 'Menu',
  catalog: 'Catálogo',
};

export default function ConversasPage() {
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // The search now runs against the database, so it waits for a pause in
  // typing rather than firing a query per character.
  const debouncedSearch = useDebouncedValue(search.trim());

  // Filtering moved to the server: applying it in the browser would only ever
  // filter the window that happened to be loaded, silently hiding matches
  // that sit outside it.
  const { data, items: conversations, isLoading, isRefreshing, error, pagination } = usePaginatedResource<
    Conversation,
    ConversationList
  >(
    '/conversations',
    {
      q: debouncedSearch || undefined,
      unread: onlyUnread ? 'true' : undefined,
      categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    },
    { pollIntervalMs: 10000 },
  );
  // The category dropdown wants every category, not the first page of them.
  const { data: categoryData } = useApiResource<Paginated<Category>>('/categories?perPage=100');

  const categories = categoryData?.items ?? [];

  const columns: DataTableColumn<Conversation>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      sortValue: (conversation) => conversation.name ?? formatPhone(conversation.phone),
      cell: (conversation) => (
        <Link
          href={`/admin/conversas/${conversation.id}`}
          className="flex items-center gap-2 underline underline-offset-4"
        >
          {conversation.unread && <span title="Não lida" className="h-2 w-2 flex-none rounded-full bg-berry" />}
          {conversation.name ?? formatPhone(conversation.phone)}
        </Link>
      ),
    },
    { key: 'phone', header: 'Telefone', cell: (conversation) => formatPhone(conversation.phone) },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (conversation) => STATUS_LABEL[conversation.status],
      cell: (conversation) => STATUS_LABEL[conversation.status],
    },
    {
      key: 'entryPoint',
      header: 'Origem',
      sortable: true,
      sortValue: (conversation) => (conversation.entryPoint ? ENTRY_POINT_LABEL[conversation.entryPoint] : null),
      cell: (conversation) => (conversation.entryPoint ? ENTRY_POINT_LABEL[conversation.entryPoint] : '—'),
    },
    {
      key: 'categories',
      header: 'Marcadores',
      cell: (conversation) => (
        <div className="flex flex-wrap gap-1">
          {(conversation.categories ?? []).map((cat) => (
            <span
              key={cat.id}
              title={cat.name}
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Atualizado em',
      sortable: true,
      sortValue: (conversation) => new Date(conversation.updatedAt).getTime(),
      defaultSortDirection: 'desc',
      cell: (conversation) => new Date(conversation.updatedAt).toLocaleString('pt-BR'),
    },
  ];

  return (
    <div>
      <PageHeader title="Conversas">
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
          <NativeSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por marcador"
            className="w-auto"
          >
            <option value="all">Todos os marcadores</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </NativeSelect>
      </PageHeader>
      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorAlert>{error}</ErrorAlert>}
      {!isLoading && !error && (
        <>
          <BusyRegion busy={isRefreshing} className="mt-6">
            <DataTable
              columns={columns}
              rows={conversations}
              rowKey={(conversation) => conversation.id}
              renderMobileCard={(conversation) => (
                <div className="rounded-md border border-sand-line p-3">
                  <Link
                    href={`/admin/conversas/${conversation.id}`}
                    className="flex items-center gap-2 font-medium underline underline-offset-4"
                  >
                    {conversation.unread && (
                      <span title="Não lida" className="h-2 w-2 flex-none rounded-full bg-berry" />
                    )}
                    {conversation.name ?? formatPhone(conversation.phone)}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">{formatPhone(conversation.phone)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                    <span>{STATUS_LABEL[conversation.status]}</span>
                    <span>{conversation.entryPoint ? ENTRY_POINT_LABEL[conversation.entryPoint] : '—'}</span>
                    <span>{new Date(conversation.updatedAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {(conversation.categories ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(conversation.categories ?? []).map((cat) => (
                        <span
                          key={cat.id}
                          title={cat.name}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </BusyRegion>
          {conversations.length === 0 && <p className="mt-6 text-ink-soft">Nenhuma conversa encontrada.</p>}
          {pagination && <TablePagination {...pagination} itemLabel="conversas" />}
        </>
      )}
    </div>
  );
}
