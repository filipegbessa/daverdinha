'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import type { DeliveryZoneAreas, ShippingPromotionAdmin } from '@/features/admin/types/admin';

/**
 * Criar ou editar o frete grátis automático: a partir de quanto, em quais
 * áreas de entrega (nenhuma marcada = todas), validade e ativo.
 */
export function ShippingPromotionDialog({
  promotion,
  onClose,
  onSaved,
}: {
  promotion: ShippingPromotionAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar a promoção.');
  const { data: zones } = useApiResource<DeliveryZoneAreas[]>('/delivery-areas');
  const [name, setName] = useState(promotion?.name ?? '');
  const [minCents, setMinCents] = useState(Math.round((promotion?.minSubtotal ?? 0) * 100));
  const [areaIds, setAreaIds] = useState<string[]>(promotion?.areaIds ?? []);
  const [startsAt, setStartsAt] = useState(promotion?.startsAt ? toDatetimeLocal(promotion.startsAt) : '');
  const [endsAt, setEndsAt] = useState(promotion?.endsAt ? toDatetimeLocal(promotion.endsAt) : '');
  const [active, setActive] = useState(promotion?.active ?? true);

  async function handleSubmit() {
    const body = {
      name: name.trim() || null,
      minSubtotal: minCents / 100,
      areaIds,
      startsAt: fromDatetimeLocal(startsAt),
      endsAt: fromDatetimeLocal(endsAt),
      active,
    };
    const ok = await save.run(() =>
      promotion
        ? apiFetch(`/shipping-promotions/${promotion.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : apiFetch('/shipping-promotions', { method: 'POST', body: JSON.stringify(body) }),
    );
    if (ok) onSaved();
  }

  return (
    <FormDialog
      title={promotion ? 'Editar frete grátis' : 'Novo frete grátis'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="promotionMin" label="Frete grátis a partir de" hint="Soma dos itens, já descontado o cupom.">
        <Input
          id="promotionMin"
          inputMode="numeric"
          value={formatCurrency(minCents / 100, 'BRL')}
          onChange={(e) => setMinCents(centsFromInput(e.target.value))}
        />
      </FormField>
      <fieldset>
        <legend className="mb-1 font-medium">Áreas de entrega</legend>
        <p className="mb-2 text-sm text-muted-foreground">Nenhuma marcada = vale em todas.</p>
        <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-border p-2">
          {(zones ?? [])
            .filter((zone) => zone.areas.length > 0)
            .map((zone) => (
              <div key={zone.zone}>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{zone.zone}</p>
                {zone.areas.map((area) => (
                  <label key={area.id} className="flex items-center gap-2 py-0.5 text-sm">
                    <input
                      type="checkbox"
                      checked={areaIds.includes(area.id)}
                      onChange={() =>
                        setAreaIds((prev) =>
                          prev.includes(area.id) ? prev.filter((id) => id !== area.id) : [...prev, area.id],
                        )
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    {area.name} ({area.fee === 0 ? 'já grátis' : formatCurrency(area.fee, 'BRL')})
                  </label>
                ))}
              </div>
            ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="promotionStarts" label="Começa em (opcional)" hint="Horário do Rio.">
          <Input
            id="promotionStarts"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </FormField>
        <FormField id="promotionEnds" label="Termina em (opcional)">
          <Input id="promotionEnds" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </FormField>
      </div>
      <FormField id="promotionName" label="Nome interno (opcional)" hint="Só aparece aqui no admin.">
        <Input id="promotionName" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <SwitchField label="Promoção ativa" checked={active} onCheckedChange={setActive} />
    </FormDialog>
  );
}
