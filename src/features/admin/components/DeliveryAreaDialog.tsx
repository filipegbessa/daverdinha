'use client';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { normalizeSearch } from '@/features/admin/lib/normalize-search';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField } from '@/features/admin/components/FormField';
import type { DeliveryAreaAdmin, DeliveryLocation } from '@/features/admin/types/admin';

/**
 * Criar ou editar uma área de entrega de uma zona: nome, valor e quais
 * bairros da zona ela cobre. Salva em dois passos (a área, depois a lista
 * de bairros), porque a API troca a lista inteira de uma vez.
 */
export function DeliveryAreaDialog({
  zone,
  area,
  zoneLocations,
  areaNames,
  onClose,
  onSaved,
}: {
  zone: string;
  area: DeliveryAreaAdmin | null;
  /** Todos os bairros da zona, com a área de cada um. */
  zoneLocations: DeliveryLocation[];
  /** Nome das áreas da zona por id, pra mostrar de onde um bairro sai. */
  areaNames: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar a área de entrega.');
  const [name, setName] = useState(area?.name ?? '');
  const [feeCents, setFeeCents] = useState(() => Math.round((area?.fee ?? 0) * 100));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(area?.locations.map((l) => l.id) ?? []),
  );
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = normalizeSearch(search);
    return zoneLocations.filter((l) => normalizeSearch(l.regionName).includes(term));
  }, [zoneLocations, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    const ok = await save.run(async () => {
      const body = { name: name.trim(), fee: feeCents / 100 };
      const saved = (await (area
        ? apiFetch(`/delivery-areas/${area.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : apiFetch('/delivery-areas', { method: 'POST', body: JSON.stringify({ zone, ...body }) }))) as DeliveryAreaAdmin;
      await apiFetch(`/delivery-areas/${saved.id}/locations`, {
        method: 'PUT',
        body: JSON.stringify({ locationIds: [...selected] }),
      });
    });
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={area ? `Editar área · ${zone}` : `Nova área · ${zone}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="areaName" label="Nome" hint="Ex.: Perto, Até 5 km, Centro e Lapa.">
          <Input id="areaName" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </FormField>
        <FormField id="areaFee" label="Valor da entrega">
          <Input
            id="areaFee"
            inputMode="numeric"
            value={formatCurrency(feeCents / 100, 'BRL')}
            onChange={(e) => setFeeCents(centsFromInput(e.target.value))}
          />
        </FormField>
      </div>
      <fieldset>
        <legend className="mb-1 font-medium">Bairros ({selected.size})</legend>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar bairro"
          aria-label="Buscar bairro"
        />
        <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-sand-line p-2">
          {visible.map((location) => {
            const otherArea =
              location.areaId && location.areaId !== area?.id ? areaNames[location.areaId] : undefined;
            const notes = [!location.covered && 'não atendido', otherArea && `hoje em ${otherArea}`].filter(Boolean);
            return (
              <li key={location.id}>
                <label className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(location.id)}
                    onChange={() => toggle(location.id)}
                    className="h-4 w-4 accent-berry"
                  />
                  {location.regionName}
                  {notes.length > 0 && <span className="text-ink-soft">({notes.join(', ')})</span>}
                </label>
              </li>
            );
          })}
          {visible.length === 0 && <li className="py-1 text-sm text-ink-soft">Nenhum bairro encontrado.</li>}
        </ul>
        <p className="mt-1 text-sm text-ink-soft">
          Marcar um bairro que está em outra área move ele pra esta. Bairro não atendido só recebe entrega
          depois de marcado como atendido.
        </p>
      </fieldset>
    </FormDialog>
  );
}
