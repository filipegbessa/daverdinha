'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { SectionLabel } from '@/features/admin/components/SectionLabel';
import type { StoreSettings } from '@/features/admin/types/admin';

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Pedido de exemplo do texto de ajuda do parcelamento. */
const EXAMPLE_TOTAL = 100;

/** Mesma regra da API (`installmentsFor`): até o máximo, sem parcela abaixo do mínimo. */
function installmentsFor(total: number, max: number, minCents: number): number {
  const byValue = minCents <= 0 ? max : Math.floor((total * 100) / minCents);
  return Math.max(1, Math.min(max, byValue));
}

/**
 * Configurações da loja online: retirada no ateliê e parcelamento no
 * cartão. Uma tela só, com um "Salvar", porque é uma linha só na API.
 */
export default function LojaPage() {
  const { apiFetch } = useApiClient();
  const { data, isLoading, error, refetch } = useApiResource<StoreSettings>('/store-settings');
  const save = useApiMutation('Erro ao salvar as configurações da loja.');
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [minCents, setMinCents] = useState(0);
  const [saved, setSaved] = useState(false);

  // O formulário começa com o que veio da API e, depois, é da cliente.
  useEffect(() => {
    if (data && !form) {
      setForm(data);
      setMinCents(Math.round(data.minInstallmentValue * 100));
    }
  }, [data, form]);

  if (isLoading || (!form && !error)) return <LoadingState />;
  if (!form) return <ErrorAlert>{error ?? 'Não foi possível carregar as configurações da loja.'}</ErrorAlert>;

  const missingPickupText = form.pickupAddress.trim() === '' || form.pickupHours.trim() === '';
  const example = installmentsFor(EXAMPLE_TOTAL, form.maxInstallments, minCents);

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSaved(false);
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || missingPickupText) return;
    const ok = await save.run(() =>
      apiFetch('/store-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          pickupEnabled: form.pickupEnabled,
          pickupAddress: form.pickupAddress.trim(),
          pickupHours: form.pickupHours.trim(),
          pickupInstructions: form.pickupInstructions?.trim() || null,
          maxInstallments: form.maxInstallments,
          minInstallmentValue: minCents / 100,
        }),
      }),
    );
    if (ok) {
      setSaved(true);
      refetch();
    }
  }

  return (
    <div>
      <PageHeader title="Loja" />
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-8">
        <section aria-labelledby="pickup-title" className="space-y-4">
          <SectionLabel variant="title" id="pickup-title">
            Retirada no ateliê
          </SectionLabel>
          <SwitchField
            label="Oferecer retirada no ateliê"
            checked={form.pickupEnabled}
            onCheckedChange={(checked) => update('pickupEnabled', checked)}
          />
          {!form.pickupEnabled && (
            <p className="text-sm text-muted-foreground">O checkout não oferece retirada enquanto estiver desligada.</p>
          )}
          <FormField
            id="pickupAddress"
            label="Endereço"
            error={form.pickupAddress.trim() === '' ? 'Informe o endereço da retirada.' : undefined}
          >
            <Input
              id="pickupAddress"
              value={form.pickupAddress}
              onChange={(e) => update('pickupAddress', e.target.value)}
              maxLength={200}
            />
          </FormField>
          <FormField
            id="pickupHours"
            label="Horário"
            hint="Texto livre, ex.: Seg a sex, 10h às 18h."
            error={form.pickupHours.trim() === '' ? 'Informe o horário da retirada.' : undefined}
          >
            <Input
              id="pickupHours"
              value={form.pickupHours}
              onChange={(e) => update('pickupHours', e.target.value)}
              maxLength={200}
            />
          </FormField>
          <FormField id="pickupInstructions" label="Instruções (opcional)" hint="Aparece no checkout e no pedido.">
            <Textarea
              id="pickupInstructions"
              value={form.pickupInstructions ?? ''}
              onChange={(e) => update('pickupInstructions', e.target.value)}
              rows={3}
              maxLength={500}
            />
          </FormField>
        </section>

        <section aria-labelledby="installments-title" className="space-y-4">
          <SectionLabel variant="title" id="installments-title">
            Parcelamento no cartão
          </SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="maxInstallments" label="Máximo de parcelas">
              <NativeSelect
                id="maxInstallments"
                value={String(form.maxInstallments)}
                onChange={(e) => update('maxInstallments', Number(e.target.value))}
              >
                {INSTALLMENT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? 'Só à vista' : `Até ${n}x`}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="minInstallmentValue" label="Valor mínimo da parcela">
              <Input
                id="minInstallmentValue"
                inputMode="numeric"
                value={formatCurrency(minCents / 100, 'BRL')}
                onChange={(e) => {
                  setSaved(false);
                  setMinCents(centsFromInput(e.target.value));
                }}
              />
            </FormField>
          </div>
          <p className="text-sm text-muted-foreground">
            Sem juros pro cliente: a taxa do parcelamento é descontada do valor que você recebe.{' '}
            <span aria-live="polite">
              Um pedido de {formatCurrency(EXAMPLE_TOTAL, 'BRL')}{' '}
              {example === 1
                ? 'só pode ser pago à vista.'
                : `pode ser pago em até ${example}x de ${formatCurrency(EXAMPLE_TOTAL / example, 'BRL')}.`}
            </span>
          </p>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={save.isPending} loadingText="Salvando..." disabled={missingPickupText}>
            Salvar
          </Button>
          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              Configurações salvas.
            </p>
          )}
        </div>
        {save.error && <ErrorText>{save.error}</ErrorText>}
      </form>
    </div>
  );
}
