'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/features/admin/lib/format-currency';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { DeliveryAreaDialog } from '@/features/admin/components/DeliveryAreaDialog';
import type { DeliveryAreaAdmin, DeliveryLocation } from '@/features/admin/types/admin';

/**
 * As áreas de entrega do site, por zona: cada área tem um valor e uma lista
 * de bairros. Bairro atendido sem área não recebe entrega pelo site — o
 * aviso lista quais são, pra cliente não esquecer nenhum.
 */
export function DeliveryAreasSection({
  areas,
  locations,
  busy,
  onChanged,
}: {
  areas: DeliveryAreaAdmin[];
  locations: DeliveryLocation[];
  busy: boolean;
  /** Recarrega áreas e bairros: mudar uma área muda o `areaId` dos bairros. */
  onChanged: () => void;
}) {
  const { apiFetch } = useApiClient();
  const remove = useApiMutation('Erro ao excluir a área de entrega.');
  const [editing, setEditing] = useState<{ zone: string; area: DeliveryAreaAdmin | null } | null>(null);
  const [deleting, setDeleting] = useState<DeliveryAreaAdmin | null>(null);

  const zones = [...new Set(locations.map((l) => l.zone))];
  const areaNames = Object.fromEntries(areas.map((a) => [a.id, a.name]));

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/delivery-areas/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      onChanged();
    }
  }

  return (
    <section aria-labelledby="delivery-areas-title" className="mt-6">
      <h2 id="delivery-areas-title" className="text-lg font-semibold">
        Áreas de entrega do site
      </h2>
      <p className="text-sm text-ink-soft">
        O valor da entrega no site é o da área do bairro. O bot usa só a lista de bairros atendidos, mais abaixo.
      </p>
      <div className="mt-3 space-y-4">
        {zones.map((zone) => {
          const zoneAreas = areas.filter((a) => a.zone === zone);
          const unassigned = locations.filter((l) => l.zone === zone && l.covered && !l.areaId);
          return (
            <div key={zone} className="rounded-lg border border-sand-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-berry uppercase">{zone}</h3>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditing({ zone, area: null })}
                  aria-label={`Nova área em ${zone}`}
                >
                  Nova área
                </Button>
              </div>
              <AdminList busy={busy} isEmpty={zoneAreas.length === 0} empty="Nenhuma área nesta zona ainda.">
                {zoneAreas.map((area) => (
                  <AdminListItem key={area.id}>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{area.name}</span>
                      <span className="text-sm text-ink-soft">
                        {' '}
                        · {formatCurrency(area.fee, 'BRL')} · {area.locations.length}{' '}
                        {area.locations.length === 1 ? 'bairro' : 'bairros'}
                      </span>
                    </span>
                    <Button variant="outline" disabled={busy} onClick={() => setEditing({ zone, area })}>
                      Editar
                    </Button>
                    <Button variant="destructive" disabled={busy} onClick={() => setDeleting(area)}>
                      Excluir
                    </Button>
                  </AdminListItem>
                ))}
              </AdminList>
              {unassigned.length > 0 && (
                <p className="mt-3 text-sm text-berry">
                  Sem entrega pelo site até entrarem numa área: {unassigned.map((l) => l.regionName).join(', ')}.
                </p>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <DeliveryAreaDialog
          zone={editing.zone}
          area={editing.area}
          zoneLocations={locations.filter((l) => l.zone === editing.zone)}
          areaNames={areaNames}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir a área "${deleting.name}"?`}
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>Os bairros dessa área ficam sem entrega pelo site até entrarem em outra. O bot não muda.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
