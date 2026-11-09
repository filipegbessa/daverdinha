'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { formatCurrency } from '@/features/admin/lib/format-currency';
import {
  deliveryLabel,
  formatOrderDate,
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
} from '@/features/admin/lib/site-order-labels';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { FilterBar, PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { SiteOrderAdmin, SiteOrderStatus } from '@/features/admin/types/admin';

/**
 * Pedidos feitos no site. Abre nos pagos, que é o que a cliente acompanha;
 * pendentes, vencidos e cancelados ficam no filtro.
 */
export default function PedidosPage() {
  const [status, setStatus] = useState<SiteOrderStatus>('paid');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data, items: orders, isLoading, isRefreshing, error, pagination } = usePaginatedResource<SiteOrderAdmin>(
    '/site-orders',
    { status, q: q || undefined },
  );

  return (
    <div>
      <PageHeader title="Pedidos" />
      <FilterBar>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Código ou nome"
          aria-label="Buscar pedidos"
          className="w-56"
        />
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as SiteOrderStatus)}
          aria-label="Filtrar por status"
          className="w-auto"
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
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
                <span className="text-ink-soft"> · {order.customer.name}</span>
                <span className="block text-sm text-ink-soft">
                  {formatOrderDate(order.createdAt)} · {deliveryLabel(order)}
                  {order.status === 'paid' && ` · ${FULFILLMENT_LABELS[order.fulfillmentStatus]}`}
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
