'use client';
import Link from 'next/link';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/lib/format';
import type { SalesSummary } from '@/features/admin/types/admin';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * O topo do Dashboard: quanto vendeu, o que tem pra preparar, o que mais sai
 * e o que está acabando. Vem de `GET /site-orders/summary`; se falhar, só
 * este bloco avisa, e os interruptores continuam funcionando.
 */
export function SalesSummaryPanel() {
  const { data, isLoading, error } = useApiResource<SalesSummary>('/site-orders/summary');

  if (!data) {
    return (
      <section aria-labelledby="sales-title" className="mt-6">
        <h2 id="sales-title" className="text-sm font-semibold">
          Vendas pelo site
        </h2>
        {isLoading ? <LoadingState /> : <ErrorText>{error ?? 'Não foi possível carregar as vendas.'}</ErrorText>}
      </section>
    );
  }

  const periods = [
    { label: 'Hoje', value: data.today },
    { label: 'Últimos 7 dias', value: data.last7Days },
    { label: 'Últimos 30 dias', value: data.last30Days },
  ];

  return (
    <section aria-labelledby="sales-title" className="mt-6 space-y-4">
      <h2 id="sales-title" className="text-sm font-semibold">
        Vendas pelo site
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {periods.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(value.revenue, 'BRL')}</dd>
            <dd className="text-xs text-muted-foreground">{plural(value.orders, 'pedido', 'pedidos')}</dd>
          </div>
        ))}
        <div className="rounded-lg border border-border p-3">
          <dt className="text-xs text-muted-foreground">Valor médio (30 dias)</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {data.averageTicket30Days === null ? '—' : formatCurrency(data.averageTicket30Days, 'BRL')}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/pedidos"
          className="rounded-lg border border-border px-3 py-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <strong className="tabular-nums">{data.toPrepare}</strong> a preparar
        </Link>
        <Link
          href="/admin/pedidos"
          className="rounded-lg border border-border px-3 py-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <strong className="tabular-nums">{data.readyToDeliver}</strong> prontos para entregar ou retirar
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Mais vendidos (30 dias)</h3>
          {data.topProducts.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nenhuma venda nos últimos 30 dias.</p>
          ) : (
            <ol aria-label="Mais vendidos" className="mt-1 space-y-1 text-sm">
              {data.topProducts.map((product) => (
                <li key={product.name} className="flex justify-between gap-3">
                  <span>{product.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {plural(product.quantity, 'unidade', 'unidades')}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">
            Estoque baixo (até {data.lowStock.threshold})
          </h3>
          {data.lowStock.products.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nenhum produto acabando.</p>
          ) : (
            <ul aria-label="Estoque baixo" className="mt-1 space-y-1 text-sm">
              {data.lowStock.products.map((product) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <Link href="/admin/produtos" className="hover:underline">
                    {product.name}
                  </Link>
                  <span className={product.stock === 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                    {product.stock === 0 ? 'Esgotado' : plural(product.stock, 'unidade', 'unidades')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
