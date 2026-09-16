'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useDebouncedValue } from '@/features/admin/lib/use-debounced-value';
import { usePagination } from '@/features/admin/lib/use-pagination';
import { TablePagination } from '@/features/admin/components/TablePagination';
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
  const filterKey = `${debouncedSearch}|${onlyUnread}|${categoryFilter}`;
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const { page, setPage } = usePagination(filterKey, totalPages);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (onlyUnread) params.set('unread', 'true');
    if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
    if (page > 1) params.set('page', String(page));
    const queryString = params.toString();
    return `/conversations${queryString ? `?${queryString}` : ''}`;
  }, [debouncedSearch, onlyUnread, categoryFilter, page]);

  const { data, isLoading, error } = useApiResource<ConversationList>(path, { pollIntervalMs: 10000 });
  // The category dropdown wants every category, not the first page of them.
  const { data: categoryData } = useApiResource<Paginated<Category>>('/categories?perPage=100');

  const conversations = data?.items ?? [];
  const categories = categoryData?.items ?? [];

  useEffect(() => {
    if (data) setTotalPages(data.totalPages);
  }, [data]);

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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="rounded-md border border-sand-line bg-paper px-2 py-1.5 text-sm"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorAlert>{error}</ErrorAlert>}
      {!isLoading && !error && (
        <>
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Atualizado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conversation) => (
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
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{new Date(conversation.updatedAt).toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {conversations.length === 0 && <p className="mt-6 text-ink-soft">Nenhuma conversa encontrada.</p>}
          {data && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="conversas"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
