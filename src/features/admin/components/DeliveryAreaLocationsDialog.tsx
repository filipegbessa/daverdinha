'use client';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { normalizeSearch } from '@/features/admin/lib/normalize-search';
import type { DeliveryAreaAdmin } from '@/features/admin/types/admin';

/** A partir de quantos bairros a lista ganha busca. */
const SEARCH_FROM = 10;

/**
 * Só pra ver quais bairros uma área de entrega cobre, sem abrir o formulário
 * de edição. Os bairros já vêm na área (`area.locations`): nada é buscado na
 * API. "Editar área" troca este modal pelo de edição.
 */
export function DeliveryAreaLocationsDialog({
  area,
  onClose,
  onEdit,
}: {
  area: DeliveryAreaAdmin;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [search, setSearch] = useState('');
  const locations = useMemo(() => {
    const term = normalizeSearch(search);
    return [...area.locations]
      .sort((a, b) => a.regionName.localeCompare(b.regionName, 'pt-BR'))
      .filter((l) => normalizeSearch(l.regionName).includes(term));
  }, [area.locations, search]);
  const total = area.locations.length;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b py-4 pr-12 pl-4">
          <DialogTitle>Bairros de {area.name}</DialogTitle>
          <DialogDescription>
            {area.zone} · {area.fee === 0 ? 'Entrega grátis' : formatCurrency(area.fee, 'BRL')} · {total}{' '}
            {total === 1 ? 'bairro' : 'bairros'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {total > SEARCH_FROM && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bairro"
              aria-label="Buscar bairro"
            />
          )}
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bairro nesta área ainda.</p>
          ) : (
            <ul
              aria-label={`Bairros de ${area.name}`}
              className="divide-y divide-border rounded-lg border border-border"
            >
              {locations.map((location) => (
                <li key={location.id} className="px-3 py-2 text-sm">
                  {location.regionName}
                </li>
              ))}
              {locations.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum bairro encontrado.</li>
              )}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" onClick={onEdit}>
            Editar área
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
