'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { formatCurrency } from '@/lib/format';
import {
  deliveryLabel,
  formatOrderDate,
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
} from '@/features/admin/lib/site-order-labels';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { SiteOrderAdmin, SiteOrderStatus } from '@/features/admin/types/admin';

const DEFAULT_FILTERS: { q: string; status: SiteOrderStatus; kind: '' | SiteOrderAdmin['kind'] } = {
  q: '',
  status: 'paid',
  kind: '',
};

/** O que a linha mostra no lugar da entrega: o evento e quantos ingressos. */
function orderSummary(order: SiteOrderAdmin): string {
  if (order.kind === 'tickets') {
    const count = order.tickets.length;
    return `${order.event?.title ?? 'Ingresso'} · ${count} ${count === 1 ? 'ingresso' : 'ingressos'}`;
  }
  const preparation = order.status === 'paid' ? ` · ${FULFILLMENT_LABELS[order.fulfillmentStatus]}` : '';
  return `${deliveryLabel(order)}${preparation}`;
}

/**
 * Pedidos feitos no site. Abre nos pagos, que é o que a cliente acompanha;
 * pendentes, vencidos e cancelados ficam no filtro.
 */
export default function PedidosPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { status, kind } = filters;
  const q = useDebouncedValue(filters.q.trim());
  const {
    data,
    items: orders,
    isLoading,
    isRefreshing,
    error,
    pagination,
  } = usePaginatedResource<SiteOrderAdmin>('/site-orders', {
    status,
    kind: kind || undefined,
    q: q || undefined,
  });

  return (
    <div>
      <PageHeader title="Pedidos" />
      <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
        {(values, set) => (
          <>
            <Input
              value={values.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Código ou nome"
              aria-label="Buscar pedidos"
              className="w-56"
            />
            <NativeSelect
              value={values.status}
              onChange={(e) => set({ status: e.target.value as SiteOrderStatus })}
              aria-label="Filtrar por status"
              className="w-auto"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={values.kind}
              onChange={(e) => set({ kind: e.target.value as typeof values.kind })}
              aria-label="Filtrar por tipo"
              className="w-auto"
            >
              <option value="">Produtos e ingressos</option>
              <option value="products">Produtos</option>
              <option value="tickets">Ingressos</option>
            </NativeSelect>
          </>
        )}
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={isRefreshing}
          isEmpty={orders.length === 0}
          empty={q ? 'Nenhum pedido encontrado com essa busca.' : 'Nenhum pedido aqui ainda.'}
        >
          {orders.map((order) => (
            <AdminListItem key={order.id}>
              <Link href={`/admin/pedidos/${order.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="font-medium">{order.code}</span>
                <span className="text-muted-foreground"> · {order.customer.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {formatOrderDate(order.createdAt)} · {orderSummary(order)}
                </span>
              </Link>
              <span className="font-semibold tabular-nums">{formatCurrency(order.total, 'BRL')}</span>
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="pedidos" />}
    </div>
  );
}
