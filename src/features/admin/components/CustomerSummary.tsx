'use client';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { formatOrderDate, ORDER_STATUS_SINGULAR } from '@/features/admin/lib/site-order-labels';
import { Badge } from '@/features/admin/components/Badge';
import type { CustomerByPhone } from '@/features/admin/types/admin';

function stats(customer: NonNullable<CustomerByPhone['customer']>): string {
  const orders = customer.ordersCount === 1 ? '1 pedido pago' : `${customer.ordersCount} pedidos pagos`;
  return `${orders} · ${formatCurrency(customer.totalSpent, 'BRL')} · última compra em ${formatOrderDate(customer.lastOrderAt)}`;
}

/**
 * A ponte entre o WhatsApp e a loja, pelo telefone (com ou sem o nono
 * dígito). Na conversa (`variant="conversation"`): as compras da cliente, sem
 * precisar perguntar. No pedido (`variant="order"`): o histórico e o atalho
 * pra conversa do bot. Sem pedido nem conversa, não mostra nada; um erro
 * também some, porque é um extra da tela.
 */
export function CustomerSummary({
  phone,
  variant,
  currentOrderId,
}: {
  phone: string;
  variant: 'conversation' | 'order';
  /** No pedido: tira ele mesmo da lista de "outros pedidos". */
  currentOrderId?: string;
}) {
  const { data } = useApiResource<CustomerByPhone>(`/customers/by-phone?phone=${encodeURIComponent(phone)}`);
  // Resposta fora do formato (API antiga, por exemplo) some como um erro.
  if (!data || !Array.isArray(data.recentOrders)) return null;

  const orders = data.recentOrders.filter((o) => o.id !== currentOrderId);
  const allOrdersHref = data.customer ? `/admin/pedidos?q=${encodeURIComponent(data.customer.email)}` : null;

  if (variant === 'order') {
    if (!data.conversationId && !data.customer) return null;
    return (
      <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
        {data.customer && (
          <p className="text-muted-foreground">
            {stats(data.customer)}
            {allOrdersHref && (
              <>
                {' · '}
                <Link href={allOrdersHref} className="text-primary underline">
                  ver pedidos
                </Link>
              </>
            )}
          </p>
        )}
        {data.conversationId && (
          <Link
            href={`/admin/conversas/${data.conversationId}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <MessageCircle aria-hidden="true" />
            Abrir conversa
          </Link>
        )}
      </div>
    );
  }

  if (!data.customer && orders.length === 0) return null;
  return (
    <section aria-label="Compras desta cliente" className="flex-none border-b border-border py-3 text-sm">
      <p>
        <span className="font-medium">{data.customer ? 'Cliente da loja' : 'Pedidos no site'}</span>
        {data.customer && <span className="text-muted-foreground"> · {stats(data.customer)}</span>}
        {allOrdersHref && (
          <>
            {' · '}
            <Link href={allOrdersHref} className="text-primary underline">
              todos os pedidos
            </Link>
          </>
        )}
      </p>
      {orders.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 hover:bg-muted"
              >
                <span className="font-medium">{order.code}</span>
                <span className="tabular-nums">{formatCurrency(order.total, 'BRL')}</span>
                <Badge size="sm">{ORDER_STATUS_SINGULAR[order.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
