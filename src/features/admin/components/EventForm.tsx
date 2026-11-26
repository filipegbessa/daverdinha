'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { centsFromInput } from '@/features/admin/lib/currency-input';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { FormCard } from '@/features/admin/components/FormCard';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { ImagesInput } from '@/features/admin/components/ImagesInput';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import type { EventAdmin } from '@/features/admin/types/admin';

/** Limites da API pro máximo de ingressos por compra. */
const MIN_PER_ORDER = 1;
const MAX_PER_ORDER = 50;
const DEFAULT_PER_ORDER = 10;

type Errors = Partial<Record<'title' | 'description' | 'endsAt' | 'spots' | 'maxTicketsPerOrder', string>>;

interface Values {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  locationAddress: string;
  /** Em centavos; `null` = gratuito. */
  priceCents: number | null;
  spots: string;
  unlimited: boolean;
  published: boolean;
  ticketSales: boolean;
  maxPerOrder: string;
}

function valuesOf(event: Partial<EventAdmin> | null): Values {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    startsAt: event?.startsAt ? toDatetimeLocal(event.startsAt) : '',
    endsAt: event?.endsAt ? toDatetimeLocal(event.endsAt) : '',
    locationName: event?.locationName ?? '',
    locationAddress: event?.locationAddress ?? '',
    priceCents: event?.price ? Math.round(event.price * 100) : null,
    spots: event?.spots?.toString() ?? '',
    // Como o "Sob encomenda" dos produtos: sem limite desliga o número. Evento
    // novo começa com limite, pra ninguém esquecer as vagas.
    unlimited: event?.id ? event.spots === null : false,
    published: event?.published ?? false,
    ticketSales: event?.ticketSales ?? false,
    maxPerOrder: String(event?.maxTicketsPerOrder ?? DEFAULT_PER_ORDER),
  };
}

/**
 * O cadastro de evento em página própria (`/admin/eventos/novo` e
 * `/admin/eventos/<id>`), no lugar do antigo modal, no mesmo padrão do
 * produto: à esquerda o que descreve o evento (informações, data e local,
 * capa, ingressos e vagas), à direita o estado (publicado), a prévia do card
 * e o link no site. Vai como `multipart/form-data`; campo opcional vazio vai
 * como `""` e a API grava `null` (sem local = no ateliê, sem preço =
 * gratuito, sem vagas = sem limite). Datas no horário do Rio, enviadas em UTC.
 *
 * `event` é o que está salvo (editar); `initial` só preenche um evento novo
 * (duplicar), sem fotos. Com alterações não salvas, fechar ou recarregar a
 * aba pede confirmação.
 */
export function EventForm({
  event,
  initial,
  onSaved,
  notice,
}: {
  event: EventAdmin | null;
  initial?: Partial<EventAdmin>;
  onSaved: (saved: EventAdmin) => void;
  notice?: string | null;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar o evento.');
  const [baseline, setBaseline] = useState(() => valuesOf(event ?? initial ?? null));
  const [values, setValues] = useState(baseline);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(notice ?? null);

  const dirty = useMemo(
    () => files.length > 0 || (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== baseline[key]),
    [values, baseline, files],
  );
  const canSave = !event || dirty;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setSavedNotice(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(start: string | null, end: string | null): Errors {
    const found: Errors = {};
    if (values.title.trim() === '') found.title = 'Informe o título do evento.';
    if (values.description.trim() === '') found.description = 'Informe a descrição do evento.';
    if (start && end && end < start) found.endsAt = 'O fim tem que ser depois do início.';
    if (!values.unlimited && !(Number.isInteger(Number(values.spots)) && Number(values.spots) >= 1)) {
      found.spots = 'Informe a quantidade de vagas, ou marque "Sem limite de vagas".';
    }
    const max = Number(values.maxPerOrder);
    if (values.ticketSales && !(Number.isInteger(max) && max >= MIN_PER_ORDER && max <= MAX_PER_ORDER)) {
      found.maxTicketsPerOrder = `De ${MIN_PER_ORDER} a ${MAX_PER_ORDER} ingressos.`;
    }
    return found;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start = fromDatetimeLocal(values.startsAt);
    const end = fromDatetimeLocal(values.endsAt);
    const found = validate(start, end);
    setErrors(found);
    if (Object.keys(found).length > 0 || !start) return;

    const form = new FormData();
    form.append('title', values.title.trim());
    form.append('description', values.description.trim());
    form.append('startsAt', start);
    form.append('endsAt', end ?? '');
    form.append('locationName', values.locationName.trim());
    form.append('locationAddress', values.locationAddress.trim());
    // Vazio = gratuito (a API grava `null`).
    form.append('price', values.priceCents ? (values.priceCents / 100).toFixed(2) : '');
    form.append('spots', values.unlimited ? '' : values.spots.trim());
    form.append('published', String(values.published));
    form.append('ticketSales', String(values.ticketSales));
    // Só com a venda ligada: desligada, o limite salvo fica guardado na API.
    if (values.ticketSales) form.append('maxTicketsPerOrder', values.maxPerOrder);
    files.forEach((file) => form.append('images', file));

    let saved: EventAdmin | undefined;
    const ok = await save.run(async () => {
      saved = (await (event
        ? apiFetch(`/events/${event.id}`, { method: 'PATCH', body: form })
        : apiFetch('/events', { method: 'POST', body: form }))) as EventAdmin;
    });
    if (!ok || !saved) return;
    const next = valuesOf(saved);
    setBaseline(next);
    setValues(next);
    setFiles([]);
    if (event) setSavedNotice('Alterações salvas.');
    onSaved(saved);
  }

  function discard() {
    setValues(baseline);
    setFiles([]);
    setErrors({});
    save.clearError();
  }

  const cover = files.length === 0 ? (event?.images[0] ?? null) : null;
  const start = fromDatetimeLocal(values.startsAt);

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">
      {savedNotice && (
        <p role="status" className="mb-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {savedNotice}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="order-2 space-y-6 lg:order-1">
          <FormCard title="Informações">
            <FormField id="eventTitle" label="Título" error={errors.title}>
              <Input id="eventTitle" value={values.title} onChange={(e) => set('title', e.target.value)} required />
            </FormField>
            <FormField id="eventDescription" label="Descrição" error={errors.description}>
              <Textarea
                id="eventDescription"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                rows={6}
                required
              />
            </FormField>
          </FormCard>

          <FormCard title="Data e local">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="eventStartsAt" label="Início" hint="Horário do Rio.">
                <Input
                  id="eventStartsAt"
                  type="datetime-local"
                  value={values.startsAt}
                  onChange={(e) => set('startsAt', e.target.value)}
                  required
                />
              </FormField>
              <FormField id="eventEndsAt" label="Fim" hint="Opcional." error={errors.endsAt}>
                <Input
                  id="eventEndsAt"
                  type="datetime-local"
                  value={values.endsAt}
                  onChange={(e) => set('endsAt', e.target.value)}
                />
              </FormField>
              <FormField id="eventLocationName" label="Local" hint="Vazio = no ateliê, com o endereço da loja.">
                <Input
                  id="eventLocationName"
                  value={values.locationName}
                  onChange={(e) => set('locationName', e.target.value)}
                />
              </FormField>
              <FormField id="eventLocationAddress" label="Endereço do local">
                <Input
                  id="eventLocationAddress"
                  value={values.locationAddress}
                  onChange={(e) => set('locationAddress', e.target.value)}
                />
              </FormField>
            </div>
          </FormCard>

          <FormCard title="Imagens">
            <ImagesInput
              id="eventImages"
              currentImages={event?.images ?? []}
              files={files}
              onChange={(next) => {
                setSavedNotice(null);
                setFiles(next);
              }}
            />
          </FormCard>

          <FormCard title="Ingressos e vagas">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="eventPrice" label="Preço (R$)" hint="Vazio = gratuito.">
                {/* A mesma máscara de centavos do produto; apagar tudo volta a "gratuito". */}
                <Input
                  id="eventPrice"
                  inputMode="numeric"
                  placeholder="Gratuito"
                  value={values.priceCents ? formatCurrency(values.priceCents / 100, 'BRL') : ''}
                  onChange={(e) => {
                    const cents = centsFromInput(e.target.value);
                    set('priceCents', cents > 0 ? cents : null);
                  }}
                />
              </FormField>
              <div>
                <FormField
                  id="eventSpots"
                  label="Vagas"
                  hint={
                    values.unlimited ? 'O site não mostra contagem de vagas.' : 'O site mostra quantas vagas restam.'
                  }
                  error={errors.spots}
                >
                  <Input
                    id="eventSpots"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={values.unlimited ? '' : values.spots}
                    onChange={(e) => set('spots', e.target.value)}
                    disabled={values.unlimited}
                  />
                </FormField>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values.unlimited}
                    onChange={(e) => {
                      set('unlimited', e.target.checked);
                      setErrors((prev) => ({ ...prev, spots: undefined }));
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  Sem limite de vagas
                </label>
              </div>
            </div>
            <SwitchField
              label="Vender ingressos pelo site"
              checked={values.ticketSales}
              onCheckedChange={(v) => set('ticketSales', v)}
            />
            <p className="text-sm text-muted-foreground">
              Pago vira &quot;Comprar ingresso&quot;, gratuito vira &quot;Inscrever-se&quot;. Desligado, a inscrição é
              pelo WhatsApp. Só vende com &quot;Venda de ingressos&quot; ligada no Dashboard.
            </p>
            {values.ticketSales && (
              <FormField
                id="eventMaxPerOrder"
                label="Máximo de ingressos por compra"
                hint={`De ${MIN_PER_ORDER} a ${MAX_PER_ORDER}.`}
                error={errors.maxTicketsPerOrder}
              >
                <Input
                  id="eventMaxPerOrder"
                  type="number"
                  inputMode="numeric"
                  value={values.maxPerOrder}
                  onChange={(e) => set('maxPerOrder', e.target.value)}
                  className="w-32"
                />
              </FormField>
            )}
          </FormCard>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <FormCard title="Status">
            <SwitchField label="Publicado" checked={values.published} onCheckedChange={(v) => set('published', v)} />
            <p className="text-sm text-muted-foreground">
              {values.published ? 'Aparece na agenda do site.' : 'Rascunho: só aparece aqui no admin.'}
            </p>
          </FormCard>

          <FormCard title="Prévia">
            <div aria-label="Prévia do card na agenda" className="overflow-hidden rounded-lg border border-border">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no admin, sem otimizador
                <img src={cover} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  Sem foto
                </div>
              )}
              <div className="space-y-0.5 p-3">
                <p className="text-xs text-muted-foreground">{start ? formatDateTime(start) : 'Data e hora'}</p>
                <p className="font-medium">{values.title.trim() || 'Título do evento'}</p>
                <p className="text-sm">
                  {values.priceCents ? formatCurrency(values.priceCents / 100, 'BRL') : 'Gratuito'}
                  {' · '}
                  {values.locationName.trim() || 'No ateliê'}
                </p>
              </div>
            </div>
          </FormCard>

          {event && (
            <FormCard title="Vendas">
              <p className="text-sm">
                {event.sold} {event.sold === 1 ? 'ingresso vendido' : 'ingressos vendidos'}
                {event.reserved > 0 && ` · ${event.reserved} em pedido pendente`}
                {event.spots !== null && ` · ${event.spots} vagas`}
              </p>
              <Link
                href={`/admin/eventos/${event.id}/participantes?evento=${encodeURIComponent(event.title)}`}
                className="text-sm underline underline-offset-2"
              >
                Lista de presença
              </Link>
            </FormCard>
          )}

          {event && (
            <FormCard title="Link no site">
              <p className="font-mono text-sm break-all">/agenda/{event.slug}</p>
              <p className="text-sm text-muted-foreground">O endereço não muda ao renomear.</p>
            </FormCard>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          {save.error && <ErrorText className="mr-auto">{save.error}</ErrorText>}
          {event && dirty && !save.error && (
            <p className="mr-auto text-sm text-muted-foreground">Alterações não salvas</p>
          )}
          {event && dirty && (
            <Button type="button" variant="outline" onClick={discard} disabled={save.isPending}>
              Descartar alterações
            </Button>
          )}
          <Button type="submit" loading={save.isPending} loadingText="Salvando..." disabled={!canSave}>
            {event ? 'Salvar' : 'Criar evento'}
          </Button>
        </div>
      </div>
    </form>
  );
}
