'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { DeliveryLocationDialog } from '@/features/admin/components/DeliveryLocationDialog';
import type { DeliveryLocation } from '@/features/admin/types/admin';

export default function EntregasPage() {
  const { apiFetch } = useApiClient();
  const [locations, setLocations] = useState<DeliveryLocation[] | null>(null);
  const [editing, setEditing] = useState<DeliveryLocation | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function remove(location: DeliveryLocation) {
    setError(null);
    try {
      await apiFetch(`/delivery-locations/${location.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir local de entrega.');
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Locais de entrega</h1>
        <Button onClick={() => setEditing('new')}>Nova região</Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
          {error}
        </p>
      )}
      {Object.entries(byZone).map(([zone, items]) => (
        <div key={zone} className="mt-6">
          <h2 className="font-medium text-berry">{zone}</h2>
          <ul className="mt-2 space-y-2">
            {items.map((location) => (
              <li key={location.id} className="flex items-center gap-3 rounded border border-sand-line p-3">
                <span className="flex-1">{location.regionName}</span>
                <Switch
                  checked={location.covered}
                  onCheckedChange={() => toggleCovered(location)}
                  aria-label={`Atendida ${location.regionName}`}
                />
                <Button variant="outline" onClick={() => setEditing(location)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => remove(location)}>
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {editing && (
        <DeliveryLocationDialog
          location={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
