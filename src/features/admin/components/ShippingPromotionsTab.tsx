'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { formatCurrency } from '@/lib/format';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { Badge } from '@/features/admin/components/Badge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { ShippingPromotionDialog } from '@/features/admin/components/ShippingPromotionDialog';
import type { DeliveryZoneAreas, ShippingPromotionAdmin } from '@/features/admin/types/admin';

const day = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(
    new Date(iso),
  );

function status(promotion: ShippingPromotionAdmin, now = new Date()): string {
  if (!promotion.active) return 'Desativada';
  if (promotion.endsAt && new Date(promotion.endsAt) <= now) return 'Encerrada';
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return 'Agendada';
  return 'Ativa';
}

/**
 * "Promoções → Automáticas": frete grátis acima de um valor, sem código. O
 * site mostra "Faltam R$ X para frete grátis" no carrinho e no checkout.
 */
export function ShippingPromotionsTab() {
  const { apiFetch } = useApiClient();
  const { data, isLoading, error, refetch } = useApiResource<ShippingPromotionAdmin[]>('/shipping-promotions');
  const { data: zones } = useApiResource<DeliveryZoneAreas[]>('/delivery-areas');
  const remove = useApiMutation('Erro ao excluir a promoção.');
  const [editing, setEditing] = useState<ShippingPromotionAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ShippingPromotionAdmin | null>(null);
  const areaNames = Object.fromEntries((zones ?? []).flatMap((z) => z.areas.map((a) => [a.id, a.name])));

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/shipping-promotions/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Frete grátis acima de um valor, sem código, pra todo mundo que chega no mínimo. Uma área de entrega com valor
          R$ 0,00 continua sendo sempre grátis.
        </p>
        <Button onClick={() => setEditing('new')}>Novo frete grátis</Button>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList busy={remove.isPending} isEmpty={data.length === 0} empty="Nenhuma promoção automática ainda.">
          {data.map((promotion) => {
            const areas = promotion.areaIds.map((id) => areaNames[id]).filter(Boolean);
            return (
              <AdminListItem key={promotion.id}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    Frete grátis acima de {formatCurrency(promotion.minSubtotal, 'BRL')}
                    <Badge size="sm" className="ml-2">
                      {status(promotion)}
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {areas.length > 0 ? `Áreas: ${areas.join(', ')}` : 'Todas as áreas de entrega'}
                    {promotion.startsAt && ` · a partir de ${day(promotion.startsAt)}`}
                    {promotion.endsAt && ` · até ${day(promotion.endsAt)}`}
                    {promotion.name && ` · ${promotion.name}`}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setEditing(promotion)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => setDeleting(promotion)}>
                  Excluir
                </Button>
              </AdminListItem>
            );
          })}
        </AdminList>
      )}
      {editing && (
        <ShippingPromotionDialog
          promotion={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Excluir esta promoção de frete grátis?"
          confirmLabel="Excluir promoção"
          pendingLabel="Excluindo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>Os pedidos novos voltam a pagar o frete normal. Os pedidos já feitos não mudam.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
