'use client';
import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { formatCurrency } from '@/lib/format';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { formatOrderDate } from '@/features/admin/lib/site-order-labels';
import { formatPhone } from '@/features/admin/lib/format-phone';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { CustomerAdmin } from '@/features/admin/types/admin';

type Sort = 'recent' | 'spent' | 'orders';

const DEFAULT_FILTERS: { q: string; sort: Sort } = { q: '', sort: 'recent' };

/**
 * Quem já comprou no site (produtos ou ingressos), tirado dos pedidos pagos:
 * sem conta, a compradora é o e-mail. Dá pra ver quem compra mais e abrir a
 * conversa do WhatsApp do mesmo telefone.
 */
export default function ClientesPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const q = useDebouncedValue(filters.q.trim());
  const { data, items, isLoading, isRefreshing, error, pagination } = usePaginatedResource<CustomerAdmin>(
    '/customers',
    { q: q || undefined, sort: filters.sort },
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Quem já comprou no site. Os dados vêm dos pedidos pagos, agrupados por e-mail."
      />
      <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
        {(values, set) => (
          <>
            <Input
              value={values.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Nome, e-mail ou telefone"
              aria-label="Buscar clientes"
              className="w-64"
            />
            <NativeSelect
              value={values.sort}
              onChange={(e) => set({ sort: e.target.value as Sort })}
              aria-label="Ordenar clientes"
              className="w-auto"
            >
              <option value="recent">Compra mais recente</option>
              <option value="spent">Quem gastou mais</option>
              <option value="orders">Mais pedidos</option>
            </NativeSelect>
          </>
        )}
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={isRefreshing}
          isEmpty={items.length === 0}
          empty={q ? 'Nenhuma cliente com essa busca.' : 'Nenhuma compra paga ainda.'}
        >
          {items.map((customer) => (
            <AdminListItem key={customer.email}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{customer.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {customer.email} · {formatPhone(customer.phone)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customer.ordersCount === 1 ? '1 pedido' : `${customer.ordersCount} pedidos`} · última compra em{' '}
                  {formatOrderDate(customer.lastOrderAt)}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatCurrency(customer.totalSpent, 'BRL')}</span>
              <Link
                href={`/admin/pedidos?q=${encodeURIComponent(customer.email)}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Pedidos
              </Link>
              {customer.conversationId && (
                <Link
                  href={`/admin/conversas/${customer.conversationId}`}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Conversa
                </Link>
              )}
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="clientes" />}
    </div>
  );
}
