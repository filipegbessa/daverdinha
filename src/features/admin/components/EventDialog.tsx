'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { IMAGE_UPLOAD } from '@/features/admin/lib/image-upload';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import type { EventAdmin } from '@/features/admin/types/admin';

/** Limites da API pro máximo de ingressos por compra. */
const MIN_PER_ORDER = 1;
const MAX_PER_ORDER = 50;
const DEFAULT_PER_ORDER = 10;

type Errors = Partial<Record<'endsAt' | 'price' | 'spots' | 'maxTicketsPerOrder' | 'image', string>>;

/** "45,50" ou "45.50" → "45.50"; vazio continua vazio (gratuito). */
function normalizePrice(value: string): string {
  return value.trim().replace(',', '.');
}

function validImage(file: File): string | null {
  if (!(IMAGE_UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
    return `"${file.name}" precisa ser ${IMAGE_UPLOAD.typesLabel}.`;
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) return `"${file.name}" passa de ${IMAGE_UPLOAD.maxLabel}.`;
  return null;
}

/**
 * Criar e editar evento da agenda. Vai como `multipart/form-data` (texto e a
 * capa no mesmo envio). Campo opcional vazio vai como `""`, que a API grava
 * como `null` — e `null` tem significado: sem local = no ateliê, sem preço =
 * gratuito, sem vagas = sem limite, sem link = inscrição pelo WhatsApp.
 *
 * Datas digitadas no horário do Rio e enviadas em UTC. A edição parte da
 * linha da lista: não existe `GET /events/:id`.
 */
export function EventDialog({
  event,
  onClose,
  onSaved,
}: {
  event: EventAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar o evento.');
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startsAt, setStartsAt] = useState(event ? toDatetimeLocal(event.startsAt) : '');
  const [endsAt, setEndsAt] = useState(event?.endsAt ? toDatetimeLocal(event.endsAt) : '');
  const [locationName, setLocationName] = useState(event?.locationName ?? '');
  const [locationAddress, setLocationAddress] = useState(event?.locationAddress ?? '');
  const [price, setPrice] = useState(event?.price?.toString() ?? '');
  const [spots, setSpots] = useState(event?.spots?.toString() ?? '');
  // Como o "Sob encomenda" dos produtos: sem limite desliga o número (festa
  // na praça). Evento novo começa com limite, pra ninguém esquecer as vagas.
  const [unlimited, setUnlimited] = useState(event ? event.spots === null : false);
  const [published, setPublished] = useState(event?.published ?? false);
  const [ticketSales, setTicketSales] = useState(event?.ticketSales ?? false);
  const [maxPerOrder, setMaxPerOrder] = useState(String(event?.maxTicketsPerOrder ?? DEFAULT_PER_ORDER));
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate(start: string | null, end: string | null): Errors {
    const found: Errors = {};
    if (start && end && end < start) found.endsAt = 'O fim tem que ser depois do início.';
    const priceValue = normalizePrice(price);
    if (priceValue && !(Number(priceValue) >= 0))
      found.price = 'Informe o preço em reais, ou deixe vazio se for gratuito.';
    if (!unlimited && !(Number.isInteger(Number(spots)) && Number(spots) >= 1)) {
      found.spots = 'Informe a quantidade de vagas, ou marque "Sem limite de vagas".';
    }
    const max = Number(maxPerOrder);
    if (ticketSales && !(Number.isInteger(max) && max >= MIN_PER_ORDER && max <= MAX_PER_ORDER)) {
      found.maxTicketsPerOrder = `De ${MIN_PER_ORDER} a ${MAX_PER_ORDER} ingressos.`;
    }
    return found;
  }

  async function handleSubmit() {
    const start = fromDatetimeLocal(startsAt);
    const end = fromDatetimeLocal(endsAt);
    const found = validate(start, end);
    setErrors(found);
    if (Object.keys(found).length > 0 || !start) return;

    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('startsAt', start);
    // Fim é opcional: vazio grava `null`.
    form.append('endsAt', end ?? '');
    form.append('locationName', locationName.trim());
    form.append('locationAddress', locationAddress.trim());
    form.append('price', normalizePrice(price));
    // Vazio = sem limite (a API grava `null`).
    form.append('spots', unlimited ? '' : spots.trim());
    form.append('published', String(published));
    form.append('ticketSales', String(ticketSales));
    // Só com a venda ligada: desligada, o limite salvo fica guardado na API.
    if (ticketSales) form.append('maxTicketsPerOrder', maxPerOrder);
    if (image) form.append('image', image);
    else if (removeImage) form.append('removeImage', 'true');

    const ok = await save.run(() =>
      event
        ? apiFetch(`/events/${event.id}`, { method: 'PATCH', body: form })
        : apiFetch('/events', { method: 'POST', body: form }),
    );
    if (ok) onSaved();
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    const problem = file ? validImage(file) : null;
    setErrors((prev) => ({ ...prev, image: problem ?? undefined }));
    setImage(problem ? null : file);
    if (problem) e.target.value = '';
  }

  return (
    <FormDialog
      title={event ? 'Editar evento' : 'Novo evento'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isPending={save.isPending}
      error={save.error}
    >
      <FormField id="eventTitle" label="Título">
        <Input id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </FormField>
      {event && (
        <p className="text-sm text-muted-foreground">
          Endereço no site: <span className="font-mono">/agenda/{event.slug}</span>. Ele não muda ao renomear.
        </p>
      )}
      <FormField id="eventDescription" label="Descrição">
        <Textarea
          id="eventDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="eventStartsAt" label="Início" hint="Horário do Rio.">
          <Input
            id="eventStartsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </FormField>
        <FormField id="eventEndsAt" label="Fim" hint="Opcional." error={errors.endsAt}>
          <Input id="eventEndsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="eventLocationName" label="Local" hint="Vazio = no ateliê, com o endereço da loja.">
          <Input id="eventLocationName" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
        </FormField>
        <FormField id="eventLocationAddress" label="Endereço do local">
          <Input
            id="eventLocationAddress"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="eventPrice" label="Preço (R$)" hint="Vazio = gratuito." error={errors.price}>
          <Input id="eventPrice" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </FormField>
        <div>
          <FormField
            id="eventSpots"
            label="Vagas"
            hint={unlimited ? 'O site não mostra contagem de vagas.' : 'O site mostra quantas vagas restam.'}
            error={errors.spots}
          >
            <Input
              id="eventSpots"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={unlimited ? '' : spots}
              onChange={(e) => setSpots(e.target.value)}
              disabled={unlimited}
            />
          </FormField>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => {
                setUnlimited(e.target.checked);
                setErrors((prev) => ({ ...prev, spots: undefined }));
              }}
              className="h-4 w-4 accent-primary"
            />
            Sem limite de vagas
          </label>
        </div>
      </div>
      <div>
        <FormField
          id="eventImage"
          label="Foto"
          hint={`Capa do evento (${IMAGE_UPLOAD.typesLabel}, até ${IMAGE_UPLOAD.maxLabel}).`}
          error={errors.image}
        >
          <Input id="eventImage" type="file" accept={IMAGE_UPLOAD.mimeTypes.join(',')} onChange={handleImage} />
        </FormField>
        {event?.imageUrl && !image && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura no admin, não precisa do otimizador */}
            <img
              src={event.imageUrl}
              alt=""
              className={`size-16 rounded-lg border border-border object-cover ${removeImage ? 'opacity-40' : ''}`}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Remover a foto
            </label>
          </div>
        )}
      </div>
      <SwitchField label="Publicado" checked={published} onCheckedChange={setPublished} />
      <div>
        <SwitchField label="Vender ingressos pelo site" checked={ticketSales} onCheckedChange={setTicketSales} />
        <p className="mt-1 text-sm text-muted-foreground">
          Pago vira &quot;Comprar ingresso&quot;, gratuito vira &quot;Inscrever-se&quot;. Desligado, a inscrição é pelo
          WhatsApp. Só vende com &quot;Venda de ingressos&quot; ligada no Dashboard.
        </p>
      </div>
      {ticketSales && (
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
            // Sem min/max no campo: a validação do navegador barraria o envio
            // sem mensagem; a nossa mostra o limite embaixo do campo.
            value={maxPerOrder}
            onChange={(e) => setMaxPerOrder(e.target.value)}
            className="w-32"
          />
        </FormField>
      )}
    </FormDialog>
  );
}
