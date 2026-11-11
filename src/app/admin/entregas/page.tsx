'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { errorMessage } from '@/features/admin/lib/error-message';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { EmptyState } from '@/features/admin/components/AdminList';
import { DeliveryAreasSection } from '@/features/admin/components/DeliveryAreasSection';
import type { DeliveryAreaAdmin, DeliveryLocation, DeliveryZoneAreas } from '@/features/admin/types/admin';
import { SectionLabel } from '@/features/admin/components/SectionLabel';
import { ToggleButton } from '@/features/admin/components/ToggleButton';

type CoverageFilter = 'all' | 'covered' | 'not-covered';

const FILTERS: { value: CoverageFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'covered', label: 'Atende' },
  { value: 'not-covered', label: 'Não atende' },
];

const DEFAULT_FILTERS: { filter: CoverageFilter } = { filter: 'all' };

export default function EntregasPage() {
  const { apiFetch } = useApiClient();
  const {
    data: locations,
    isLoading,
    error: loadError,
    refetch: load,
  } = useApiResource<DeliveryLocation[]>('/delivery-locations');
  // Áreas de entrega do site. Elas dependem do `covered` e do `areaId` dos
  // bairros, então toda mudança aqui recarrega as duas listas.
  const {
    data: zoneAreas,
    isRefreshing: areasRefreshing,
    error: areasError,
    refetch: loadAreas,
  } = useApiResource<DeliveryZoneAreas[]>('/delivery-areas');
  const areas: DeliveryAreaAdmin[] = zoneAreas?.flatMap((z) => z.areas) ?? [];
  // Coverage toggles report their own failures; a load failure comes from
  // the resource hook. They're kept apart so a failed toggle doesn't read
  // like the whole page failed to load.
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { filter } = filters;
  // Bairro → valor marcado, enquanto o PATCH corre e até o recarregamento
  // trazer a lista nova. Sem isso o checkbox voltava ao valor antigo entre a
  // resposta do PATCH e a chegada do refetch.
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [pendingZones, setPendingZones] = useState<Set<string>>(new Set());

  /** Tira os que falharam já; os salvos ficam pendentes até a lista nova chegar. */
  async function settle(saved: string[], failed: string[]) {
    setPending((prev) => withoutKeys(prev, failed));
    if (saved.length === 0) return;
    loadAreas();
    await load();
    setPending((prev) => withoutKeys(prev, saved));
  }

  async function toggleCovered(location: DeliveryLocation) {
    setError(null);
    const nextCovered = !location.covered;
    setPending((prev) => new Map(prev).set(location.id, nextCovered));
    try {
      await apiFetch(`/delivery-locations/${location.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ covered: nextCovered }),
      });
    } catch (err) {
      setError(errorMessage(err, 'Erro ao atualizar local de entrega.'));
      await settle([], [location.id]);
      return;
    }
    await settle([location.id], []);
  }

  async function toggleZone(zone: string, zoneLocations: DeliveryLocation[]) {
    setError(null);
    setPendingZones((prev) => new Set(prev).add(zone));
    const nextCovered = !zoneLocations.every((loc) => loc.covered);
    const toUpdate = zoneLocations.filter((loc) => loc.covered !== nextCovered);
    setPending((prev) => {
      const next = new Map(prev);
      toUpdate.forEach((loc) => next.set(loc.id, nextCovered));
      return next;
    });
    const results = await Promise.allSettled(
      toUpdate.map((loc) =>
        apiFetch(`/delivery-locations/${loc.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ covered: nextCovered }),
        }),
      ),
    );
    const failed = toUpdate.filter((_, i) => results[i].status === 'rejected').map((loc) => loc.id);
    const saved = toUpdate.filter((_, i) => results[i].status === 'fulfilled').map((loc) => loc.id);
    if (failed.length > 0) setError('Erro ao atualizar a região.');
    await settle(saved, failed);
    setPendingZones((prev) => withoutKeys(prev, [zone]));
  }

  const byZone = (locations ?? []).reduce<Record<string, DeliveryLocation[]>>((acc, loc) => {
    (acc[loc.zone] ??= []).push(loc);
    return acc;
  }, {});

  // O valor que aparece: o marcado, se ainda está salvando, senão o da API.
  const isCovered = (loc: DeliveryLocation) => pending.get(loc.id) ?? loc.covered;
  const matchesFilter = (loc: DeliveryLocation) =>
    filter === 'all' || (filter === 'covered' ? loc.covered : !loc.covered);

  return (
    <div>
      <PageHeader title="Locais de entrega" />
      {isLoading && <LoadingState />}
      {!isLoading && !locations && (
        <ErrorAlert>{loadError ?? 'Não foi possível carregar os locais de entrega.'}</ErrorAlert>
      )}
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {areasError && <ErrorAlert>{areasError}</ErrorAlert>}
      {locations && zoneAreas && (
        <DeliveryAreasSection
          areas={areas}
          locations={locations}
          busy={areasRefreshing}
          onChanged={() => {
            load();
            loadAreas();
          }}
        />
      )}
      {locations && (
        <section aria-labelledby="covered-bairros-title" className="mt-8">
          <SectionLabel variant="title" id="covered-bairros-title">
            Bairros atendidos
          </SectionLabel>
          {/* O filtro é só desta lista, então fica junto dela, não no topo da página. */}
          <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
            {(values, set) => (
              <div className="flex gap-2" role="group" aria-label="Filtrar por status">
                {FILTERS.map(({ value, label }) => (
                  <ToggleButton
                    key={value}
                    pressed={values.filter === value}
                    onPressedChange={() => set({ filter: value })}
                  >
                    {label}
                  </ToggleButton>
                ))}
              </div>
            )}
          </FilterBar>
          {locations.length > 0 && !locations.some(matchesFilter) && (
            <div className="mt-3">
              <EmptyState>Nenhum bairro encontrado com esses filtros.</EmptyState>
            </div>
          )}
          <div className="mt-3 space-y-4">
            {Object.entries(byZone).map(([zone, zoneLocations]) => {
              const visible = zoneLocations.filter(matchesFilter);
              const allCovered = zoneLocations.every(isCovered);
              const noneCovered = !zoneLocations.some(isCovered);
              const zonePending = pendingZones.has(zone);

              return (
                <div key={zone} className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center gap-2 bg-muted px-3 py-2">
                    <IndeterminateCheckbox
                      checked={allCovered}
                      indeterminate={!allCovered && !noneCovered}
                      onChange={() => toggleZone(zone, zoneLocations)}
                      disabled={zonePending}
                      aria-label={`Marcar toda a região ${zone}`}
                      aria-busy={zonePending}
                      className="h-4 w-4 accent-primary disabled:cursor-wait disabled:opacity-50"
                    />
                    <SectionLabel>{zone}</SectionLabel>
                    {zonePending && <PendingSpinner />}
                  </div>
                  <ul className="grid grid-cols-1 gap-x-4 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((location) => {
                      const itemPending = pending.has(location.id);
                      return (
                        <li key={location.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={isCovered(location)}
                            onChange={() => toggleCovered(location)}
                            disabled={itemPending}
                            aria-label={`Atendida ${location.regionName}`}
                            aria-busy={itemPending}
                            className="h-4 w-4 accent-primary disabled:cursor-wait disabled:opacity-50"
                          />
                          <span className={`text-sm ${itemPending ? 'text-muted-foreground' : ''}`}>
                            {location.regionName}
                          </span>
                          {itemPending && <PendingSpinner />}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** O spinner ao lado de um bairro ou região que está salvando. */
function PendingSpinner() {
  return <Loader2 aria-hidden="true" className="size-3.5 text-muted-foreground motion-safe:animate-spin" />;
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  ...rest
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange' | 'type'>) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  });

  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} {...rest} />;
}

function withoutKeys<T extends Set<string> | Map<string, boolean>>(source: T, keys: Iterable<string>): T {
  const next = (source instanceof Map ? new Map(source) : new Set(source)) as T;
  for (const key of keys) next.delete(key);
  return next;
}
