'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { DeliveryAreaDialog } from '@/features/admin/components/DeliveryAreaDialog';
import { DeliveryAreaLocationsDialog } from '@/features/admin/components/DeliveryAreaLocationsDialog';
import type { DeliveryAreaAdmin, DeliveryLocation } from '@/features/admin/types/admin';
import { SectionLabel } from '@/features/admin/components/SectionLabel';

/**
 * As áreas de entrega, por zona: cada área tem um valor (zero = grátis) e
 * uma lista de bairros. Os bairros das áreas são os atendidos, no site e no
 * bot; o resto da zona não é.
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
  // Só olhando os bairros da área, sem editar.
  const [viewing, setViewing] = useState<DeliveryAreaAdmin | null>(null);

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
      <SectionLabel variant="title" id="delivery-areas-title">
        Áreas de entrega
      </SectionLabel>
      <p className="text-sm text-muted-foreground">
        Cada área tem um valor de entrega (R$ 0,00 = grátis). Os bairros que estão numa área são os atendidos, pelo site
        e pelo bot. Bairro fora de todas as áreas não é atendido.
      </p>
      <div className="mt-3 space-y-4">
        {zones.map((zone) => {
          const zoneAreas = areas.filter((a) => a.zone === zone);
          return (
            <div key={zone} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>{zone}</SectionLabel>
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
                    <button
                      type="button"
                      onClick={() => setViewing(area)}
                      aria-label={`Ver os bairros de ${area.name}`}
                      className="min-w-0 flex-1 rounded-md text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="font-medium">{area.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {' '}
                        · {area.fee === 0 ? 'Entrega grátis' : formatCurrency(area.fee, 'BRL')} ·{' '}
                        <span className="underline underline-offset-2">
                          {area.locations.length} {area.locations.length === 1 ? 'bairro' : 'bairros'}
                        </span>
                      </span>
                    </button>
                    <Button variant="outline" disabled={busy} onClick={() => setEditing({ zone, area })}>
                      Editar
                    </Button>
                    <Button variant="destructive" disabled={busy} onClick={() => setDeleting(area)}>
                      Excluir
                    </Button>
                  </AdminListItem>
                ))}
              </AdminList>
            </div>
          );
        })}
      </div>
      {viewing && (
        <DeliveryAreaLocationsDialog
          area={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setViewing(null);
            setEditing({ zone: viewing.zone, area: viewing });
          }}
        />
      )}
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
          <p>Os bairros dessa área deixam de ser atendidos, no site e no bot, até entrarem em outra área.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
