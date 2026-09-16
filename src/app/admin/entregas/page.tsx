'use client';
import { useEffect, useRef, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { DeliveryLocation } from '@/features/admin/types/admin';

type CoverageFilter = 'all' | 'covered' | 'not-covered';

const FILTERS: { value: CoverageFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'covered', label: 'Atende' },
  { value: 'not-covered', label: 'Não atende' },
];

export default function EntregasPage() {
  const { apiFetch } = useApiClient();
  const {
    data: locations,
    isLoading,
    error: loadError,
    refetch: load,
  } = useApiResource<DeliveryLocation[]>('/delivery-locations');
  // Coverage toggles report their own failures; a load failure comes from
  // the resource hook. They're kept apart so a failed toggle doesn't read
  // like the whole page failed to load.
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CoverageFilter>('all');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [pendingZones, setPendingZones] = useState<Set<string>>(new Set());

  async function toggleCovered(location: DeliveryLocation) {
    setError(null);
    setPendingIds((prev) => new Set(prev).add(location.id));
    try {
      await apiFetch(`/delivery-locations/${location.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ covered: !location.covered }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar local de entrega.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(location.id);
        return next;
      });
    }
  }

  async function toggleZone(zone: string, zoneLocations: DeliveryLocation[]) {
    setError(null);
    setPendingZones((prev) => new Set(prev).add(zone));
    const nextCovered = !zoneLocations.every((loc) => loc.covered);
    const toUpdate = zoneLocations.filter((loc) => loc.covered !== nextCovered);
    setPendingIds((prev) => {
      const next = new Set(prev);
      toUpdate.forEach((loc) => next.add(loc.id));
      return next;
    });
    try {
      const results = await Promise.allSettled(
        toUpdate.map((loc) =>
          apiFetch(`/delivery-locations/${loc.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ covered: nextCovered }),
          }),
        ),
      );
      await load();
      if (results.some((result) => result.status === 'rejected')) {
        setError('Erro ao atualizar a região.');
      }
    } finally {
      setPendingZones((prev) => {
        const next = new Set(prev);
        next.delete(zone);
        return next;
      });
      setPendingIds((prev) => {
        const next = new Set(prev);
        toUpdate.forEach((loc) => next.delete(loc.id));
        return next;
      });
    }
  }

  if (isLoading) return <LoadingState />;
  if (!locations) {
    return <ErrorAlert>{loadError ?? 'Não foi possível carregar os locais de entrega.'}</ErrorAlert>;
  }

  const byZone = locations.reduce<Record<string, DeliveryLocation[]>>((acc, loc) => {
    (acc[loc.zone] ??= []).push(loc);
    return acc;
  }, {});

  const matchesFilter = (loc: DeliveryLocation) =>
    filter === 'all' || (filter === 'covered' ? loc.covered : !loc.covered);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Locais de entrega</h1>
        <div className="flex gap-2" role="group" aria-label="Filtrar por status">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded border px-3 py-1 text-sm ${
                filter === value ? 'border-primary bg-primary/10' : 'border-sand-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <div className="mt-6 space-y-4">
        {Object.entries(byZone).map(([zone, zoneLocations]) => {
          const visible = zoneLocations.filter(matchesFilter);
          const allCovered = zoneLocations.every((loc) => loc.covered);
          const noneCovered = zoneLocations.every((loc) => !loc.covered);
          const zonePending = pendingZones.has(zone);

          return (
            <div key={zone} className="overflow-hidden rounded-lg border border-sand-line">
              <div className="flex items-center gap-2 bg-sand px-3 py-2">
                <IndeterminateCheckbox
                  checked={allCovered}
                  indeterminate={!allCovered && !noneCovered}
                  onChange={() => toggleZone(zone, zoneLocations)}
                  disabled={zonePending}
                  aria-label={`Marcar toda a região ${zone}`}
                  aria-busy={zonePending}
                  className="h-4 w-4 accent-berry disabled:cursor-wait disabled:opacity-50"
                />
                <h2 className="text-sm font-semibold tracking-wide text-berry uppercase">{zone}</h2>
              </div>
              <ul className="grid grid-cols-1 gap-x-4 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((location) => {
                  const itemPending = pendingIds.has(location.id);
                  return (
                    <li key={location.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={location.covered}
                        onChange={() => toggleCovered(location)}
                        disabled={itemPending}
                        aria-label={`Atendida ${location.regionName}`}
                        aria-busy={itemPending}
                        className="h-4 w-4 accent-berry disabled:cursor-wait disabled:opacity-50"
                      />
                      <span className={`text-sm ${itemPending ? 'text-ink-soft' : ''}`}>{location.regionName}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
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
