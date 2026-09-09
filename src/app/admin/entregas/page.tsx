'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { DeliveryLocation } from '@/features/admin/types/admin';

type CoverageFilter = 'all' | 'covered' | 'not-covered';

const FILTERS: { value: CoverageFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'covered', label: 'Atende' },
  { value: 'not-covered', label: 'Não atende' },
];

export default function EntregasPage() {
  const { apiFetch } = useApiClient();
  const [locations, setLocations] = useState<DeliveryLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CoverageFilter>('all');

  const load = useCallback(() => {
    return apiFetch<DeliveryLocation[]>('/delivery-locations')
      .then((data) => {
        setLocations(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os locais de entrega.');
      });
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleCovered(location: DeliveryLocation) {
    setError(null);
    try {
      await apiFetch(`/delivery-locations/${location.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ covered: !location.covered }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar local de entrega.');
    }
  }

  async function toggleZone(zoneLocations: DeliveryLocation[]) {
    setError(null);
    const nextCovered = !zoneLocations.every((loc) => loc.covered);
    try {
      await Promise.all(
        zoneLocations
          .filter((loc) => loc.covered !== nextCovered)
          .map((loc) =>
            apiFetch(`/delivery-locations/${loc.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ covered: nextCovered }),
            }),
          ),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar a região.');
    }
  }

  if (!locations) {
    return error ? (
      <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
        {error}
      </p>
    ) : (
      <p>Carregando...</p>
    );
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
      {error && (
        <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
          {error}
        </p>
      )}
      {Object.entries(byZone).map(([zone, zoneLocations]) => {
        const visible = zoneLocations.filter(matchesFilter);
        const allCovered = zoneLocations.every((loc) => loc.covered);
        const noneCovered = zoneLocations.every((loc) => !loc.covered);

        return (
          <div key={zone} className="mt-6">
            <div className="flex items-center gap-2">
              <IndeterminateCheckbox
                checked={allCovered}
                indeterminate={!allCovered && !noneCovered}
                onChange={() => toggleZone(zoneLocations)}
                aria-label={`Marcar toda a região ${zone}`}
              />
              <h2 className="font-medium text-berry">{zone}</h2>
            </div>
            <ul className="mt-2 space-y-1">
              {visible.map((location) => (
                <li key={location.id} className="flex items-center gap-3 py-1">
                  <span className="flex-1">{location.regionName}</span>
                  <Switch
                    checked={location.covered}
                    onCheckedChange={() => toggleCovered(location)}
                    aria-label={`Atendida ${location.regionName}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
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
  }, [indeterminate]);

  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} {...rest} />;
}
