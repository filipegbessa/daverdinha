'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { DeliveryLocation } from '@/features/admin/types/admin';

export function DeliveryLocationDialog({
  location,
  onClose,
  onSaved,
}: {
  location: DeliveryLocation | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const [zone, setZone] = useState(location?.zone ?? '');
  const [regionName, setRegionName] = useState(location?.regionName ?? '');
  const [covered, setCovered] = useState(location?.covered ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = { zone, regionName, covered };

    try {
      if (location) {
        await apiFetch(`/delivery-locations/${location.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/delivery-locations', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar local de entrega.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? 'Editar região' : 'Nova região'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="zone" className="block font-medium">
              Zona
            </label>
            <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="regionName" className="block font-medium">
              Bairro/Região
            </label>
            <Input id="regionName" value={regionName} onChange={(e) => setRegionName(e.target.value)} required />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={covered} onCheckedChange={setCovered} aria-label="Atendida" />
            <span>Atendida</span>
          </div>
          <Button type="submit" disabled={saving}>
            Salvar
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-berry">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
