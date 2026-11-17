'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { Badge } from '@/features/admin/components/Badge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { ToggleButton } from '@/features/admin/components/ToggleButton';
import { CouponDialog } from '@/features/admin/components/CouponDialog';
import { COUPON_STATUS_LABELS, couponBenefit, couponScope, couponStatus } from '@/features/admin/lib/coupon-text';
import type { CouponAdmin } from '@/features/admin/types/admin';

type Tab = 'coupons' | 'automatic';

const DEFAULT_FILTERS = { q: '' };

/** "3 de 50 usos (+1 reservado)". */
function usesText(coupon: CouponAdmin): string {
  const total = coupon.maxUses ? ` de ${coupon.maxUses}` : '';
  const reserved = coupon.reserved > 0 ? ` (+${coupon.reserved} em pedido pendente)` : '';
  return `${coupon.uses}${total} ${coupon.uses === 1 && !coupon.maxUses ? 'uso' : 'usos'}${reserved}`;
}

/**
 * Promoções da loja: cupons (com código, que a cliente divulga) e, na outra
 * aba, as promoções automáticas (sem código; o frete grátis acima de um valor
 * entra no pacote 4.1). Um cupom já usado não some ao excluir: é desativado.
 */
export default function PromocoesPage() {
  const { apiFetch } = useApiClient();
  const [tab, setTab] = useState<Tab>('coupons');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const q = useDebouncedValue(filters.q.trim());
  const { data, items, isLoading, isRefreshing, error, refetch, pagination } = usePaginatedResource<CouponAdmin>(
    '/coupons',
    { q: q || undefined },
  );
  const remove = useApiMutation('Erro ao excluir o cupom.');
  const [editing, setEditing] = useState<CouponAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<CouponAdmin | null>(null);

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/coupons/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div>
      <PageHeader title="Promoções">
        {tab === 'coupons' && <Button onClick={() => setEditing('new')}>Novo cupom</Button>}
      </PageHeader>
      <div role="tablist" aria-label="Tipo de promoção" className="mt-4 flex gap-2">
        <ToggleButton pressed={tab === 'coupons'} onPressedChange={() => setTab('coupons')}>
          Cupons
        </ToggleButton>
        <ToggleButton pressed={tab === 'automatic'} onPressedChange={() => setTab('automatic')}>
          Automáticas
        </ToggleButton>
      </div>

      {tab === 'automatic' ? (
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          Promoções sem código, que valem pra todo mundo que cumpre a regra. A primeira será o frete grátis acima de um
          valor, escolhendo as áreas de entrega. Enquanto isso, uma área de entrega com valor R$ 0,00 já é entrega
          grátis, e um cupom de frete grátis com pedido mínimo faz o mesmo papel.
        </p>
      ) : (
        <>
          <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
            {(values, set) => (
              <Input
                value={values.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Buscar por código"
                aria-label="Buscar cupons"
                className="w-56"
              />
            )}
          </FilterBar>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          {isLoading && <LoadingState />}
          {data && (
            <AdminList
              busy={isRefreshing || remove.isPending}
              isEmpty={items.length === 0}
              empty={
                q
                  ? 'Nenhum cupom com esse código.'
                  : 'Nenhum cupom ainda. Crie um pra divulgar no Instagram ou no WhatsApp.'
              }
            >
              {items.map((coupon) => {
                const status = couponStatus(coupon);
                return (
                  <AdminListItem key={coupon.id}>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-medium">
                        {coupon.code}
                        <Badge size="sm" className="ml-2 font-sans">
                          {COUPON_STATUS_LABELS[status]}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {couponBenefit(coupon)} · {couponScope(coupon)} · {usesText(coupon)}
                        {coupon.description && ` · ${coupon.description}`}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setEditing(coupon)}>
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={() => setDeleting(coupon)}>
                      Excluir
                    </Button>
                  </AdminListItem>
                );
              })}
            </AdminList>
          )}
          {pagination && <TablePagination {...pagination} itemLabel="cupons" />}
        </>
      )}

      {editing && (
        <CouponDialog
          coupon={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir o cupom ${deleting.code}?`}
          confirmLabel="Excluir cupom"
          pendingLabel="Excluindo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>
            {deleting.uses + deleting.reserved > 0
              ? 'Este cupom já foi usado: ele é desativado (para de valer) e continua no histórico dos pedidos.'
              : 'O cupom para de valer e sai da lista.'}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
