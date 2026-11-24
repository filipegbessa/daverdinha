'use client';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { fromDatetimeLocal, toDatetimeLocal } from '@/features/admin/lib/datetime-local';
import { IMAGE_UPLOAD } from '@/features/admin/lib/image-upload';
import { FormCard } from '@/features/admin/components/FormCard';
import { FormField, SwitchField } from '@/features/admin/components/FormField';
import { ErrorText } from '@/features/admin/components/StatusMessage';
import type { HeroSlideAdmin } from '@/features/admin/types/admin';

/** Os limites da API (`CreateHeroSlideDto`), pro texto caber no slide. */
export const SLIDE_LIMITS = {
  eyebrow: 60,
  title: 80,
  description: 200,
  linkLabel: 30,
  whatsappLabel: 30,
  whatsappMessage: 500,
} as const;

/** Mesma regra da API: caminho do site ou endereço `http(s)`. */
const LINK_PATTERN = /^(\/\S*|https?:\/\/\S+)$/;

type Errors = Partial<Record<'title' | 'link' | 'endsAt' | 'image', string>>;

interface Values {
  eyebrow: string;
  title: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
  whatsappLabel: string;
  whatsappMessage: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

function valuesOf(slide: HeroSlideAdmin | null): Values {
  return {
    eyebrow: slide?.eyebrow ?? '',
    title: slide?.title ?? '',
    description: slide?.description ?? '',
    linkLabel: slide?.linkLabel ?? '',
    linkUrl: slide?.linkUrl ?? '',
    whatsappLabel: slide?.whatsappLabel ?? '',
    whatsappMessage: slide?.whatsappMessage ?? '',
    active: slide?.active ?? true,
    startsAt: slide?.startsAt ? toDatetimeLocal(slide.startsAt) : '',
    endsAt: slide?.endsAt ? toDatetimeLocal(slide.endsAt) : '',
  };
}

function validImage(file: File): string | null {
  if (!(IMAGE_UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
    return `"${file.name}" precisa ser ${IMAGE_UPLOAD.typesLabel}.`;
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) return `"${file.name}" passa de ${IMAGE_UPLOAD.maxLabel}.`;
  return null;
}

/** Quantos caracteres ainda cabem, pra dica do campo. */
function remaining(value: string, max: number): string {
  return `${value.length}/${max}`;
}

/**
 * O cadastro de um destaque do topo da home (`/admin/destaques/novo` e
 * `/admin/destaques/<id>`), no padrão do evento: à esquerda o conteúdo do
 * slide, à direita a exibição e a prévia. Vai como `multipart/form-data`;
 * campo vazio vai como `""` e a API grava `null` (sem botão, sem validade).
 * Datas no horário do Rio, enviadas em UTC.
 */
export function HeroSlideForm({
  slide,
  onSaved,
  notice,
}: {
  slide: HeroSlideAdmin | null;
  onSaved: (saved: HeroSlideAdmin) => void;
  notice?: string | null;
}) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar o destaque.');
  const [baseline, setBaseline] = useState(() => valuesOf(slide));
  const [values, setValues] = useState(baseline);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(notice ?? null);
  const [preview, setPreview] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      image !== null ||
      removeImage ||
      (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== baseline[key]),
    [values, baseline, image, removeImage],
  );
  const canSave = !slide || dirty;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!image || typeof URL.createObjectURL !== 'function') {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setSavedNotice(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(start: string | null, end: string | null): Errors {
    const found: Errors = {};
    if (!values.title.trim()) found.title = 'Escreva o título do slide.';
    const label = values.linkLabel.trim();
    const url = values.linkUrl.trim();
    if (Boolean(label) !== Boolean(url)) {
      found.link = 'Preencha o texto e o link do botão, ou deixe os dois vazios.';
    } else if (url && !LINK_PATTERN.test(url)) {
      found.link = 'O link precisa começar com "/" (página do site) ou "https://".';
    }
    if (start && end && end <= start) found.endsAt = 'O fim tem que ser depois do início.';
    return found;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start = fromDatetimeLocal(values.startsAt);
    const end = fromDatetimeLocal(values.endsAt);
    const found = validate(start, end);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const form = new FormData();
    form.append('eyebrow', values.eyebrow.trim());
    form.append('title', values.title.trim());
    form.append('description', values.description.trim());
    form.append('linkLabel', values.linkLabel.trim());
    form.append('linkUrl', values.linkUrl.trim());
    form.append('whatsappLabel', values.whatsappLabel.trim());
    form.append('whatsappMessage', values.whatsappMessage.trim());
    form.append('active', String(values.active));
    form.append('startsAt', start ?? '');
    form.append('endsAt', end ?? '');
    if (image) form.append('image', image);
    else if (removeImage) form.append('removeImage', 'true');

    let saved: HeroSlideAdmin | undefined;
    const ok = await save.run(async () => {
      saved = (await (slide
        ? apiFetch(`/hero-slides/${slide.id}`, { method: 'PATCH', body: form })
        : apiFetch('/hero-slides', { method: 'POST', body: form }))) as HeroSlideAdmin;
    });
    if (!ok || !saved) return;
    const next = valuesOf(saved);
    setBaseline(next);
    setValues(next);
    setImage(null);
    setRemoveImage(false);
    if (slide) setSavedNotice('Alterações salvas.');
    onSaved(saved);
  }

  function discard() {
    setValues(baseline);
    setImage(null);
    setRemoveImage(false);
    setErrors({});
    save.clearError();
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    const problem = file ? validImage(file) : null;
    setErrors((prev) => ({ ...prev, image: problem ?? undefined }));
    setSavedNotice(null);
    setImage(problem ? null : file);
    if (problem) e.target.value = '';
  }

  const cover = preview ?? (removeImage ? null : (slide?.imageUrl ?? null));
  const hasLink = Boolean(values.linkLabel.trim() && values.linkUrl.trim());
  const hasWhatsapp = Boolean(values.whatsappMessage.trim());

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">
      {savedNotice && (
        <p role="status" className="mb-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {savedNotice}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="order-2 space-y-6 lg:order-1">
          <FormCard title="Texto">
            <FormField
              id="slideEyebrow"
              label="Linha de cima"
              hint={`Opcional. Ex.: "Santo Cristo · Rio de Janeiro". ${remaining(values.eyebrow, SLIDE_LIMITS.eyebrow)}`}
            >
              <Input
                id="slideEyebrow"
                value={values.eyebrow}
                maxLength={SLIDE_LIMITS.eyebrow}
                onChange={(e) => set('eyebrow', e.target.value)}
              />
            </FormField>
            <FormField
              id="slideTitle"
              label="Título"
              hint={`O título do primeiro slide é o título principal da home no Google. ${remaining(values.title, SLIDE_LIMITS.title)}`}
              error={errors.title}
            >
              <Input
                id="slideTitle"
                value={values.title}
                maxLength={SLIDE_LIMITS.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </FormField>
            <FormField
              id="slideDescription"
              label="Texto"
              hint={`Opcional. ${remaining(values.description, SLIDE_LIMITS.description)}`}
            >
              <Textarea
                id="slideDescription"
                value={values.description}
                maxLength={SLIDE_LIMITS.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
              />
            </FormField>
          </FormCard>

          <FormCard title="Imagem">
            <FormField
              id="slideImage"
              label="Foto"
              hint={`Uma imagem, de preferência 1600 × 900 (${IMAGE_UPLOAD.typesLabel}, até ${IMAGE_UPLOAD.maxLabel}). Sem foto, o slide usa o fundo da marca.`}
              error={errors.image}
            >
              <Input id="slideImage" type="file" accept={IMAGE_UPLOAD.mimeTypes.join(',')} onChange={handleImage} />
            </FormField>
            {slide?.imageUrl && !image && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => {
                    setSavedNotice(null);
                    setRemoveImage(e.target.checked);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                Remover a foto atual
              </label>
            )}
          </FormCard>

          <FormCard title="Botão principal">
            <p className="text-sm text-muted-foreground">
              Opcional. Pode levar a uma página do site (ex.: <span className="font-mono">/produtos/vasos</span> ou{' '}
              <span className="font-mono">/agenda</span>) ou a um endereço de fora, começando com https://.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="slideLinkLabel"
                label="Texto do botão"
                hint={remaining(values.linkLabel, SLIDE_LIMITS.linkLabel)}
              >
                <Input
                  id="slideLinkLabel"
                  value={values.linkLabel}
                  maxLength={SLIDE_LIMITS.linkLabel}
                  placeholder="Ver produtos"
                  onChange={(e) => set('linkLabel', e.target.value)}
                />
              </FormField>
              <FormField
                id="slideLinkUrl"
                label="Link"
                hint="Página do site abre na mesma aba; link de outro site, numa aba nova."
                error={errors.link}
              >
                <Input
                  id="slideLinkUrl"
                  value={values.linkUrl}
                  placeholder="/produtos"
                  onChange={(e) => set('linkUrl', e.target.value)}
                />
              </FormField>
            </div>
          </FormCard>

          <FormCard title="WhatsApp">
            <p className="text-sm text-muted-foreground">
              Opcional. Com a mensagem preenchida, o slide ganha um botão que abre o WhatsApp da loja com ela já
              escrita.
            </p>
            <FormField
              id="slideWhatsappMessage"
              label="Mensagem"
              hint={remaining(values.whatsappMessage, SLIDE_LIMITS.whatsappMessage)}
            >
              <Textarea
                id="slideWhatsappMessage"
                value={values.whatsappMessage}
                maxLength={SLIDE_LIMITS.whatsappMessage}
                placeholder="Oi! Vi o destaque no site e queria saber mais."
                onChange={(e) => set('whatsappMessage', e.target.value)}
                rows={2}
              />
            </FormField>
            <FormField
              id="slideWhatsappLabel"
              label="Texto do botão"
              hint={`Vazio = "Falar no WhatsApp". ${remaining(values.whatsappLabel, SLIDE_LIMITS.whatsappLabel)}`}
            >
              <Input
                id="slideWhatsappLabel"
                value={values.whatsappLabel}
                maxLength={SLIDE_LIMITS.whatsappLabel}
                placeholder="Falar no WhatsApp"
                onChange={(e) => set('whatsappLabel', e.target.value)}
              />
            </FormField>
          </FormCard>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <FormCard title="Exibição">
            <SwitchField label="Ativo" checked={values.active} onCheckedChange={(v) => set('active', v)} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <FormField id="slideStartsAt" label="Começa em" hint="Opcional. Horário do Rio.">
                <Input
                  id="slideStartsAt"
                  type="datetime-local"
                  value={values.startsAt}
                  onChange={(e) => set('startsAt', e.target.value)}
                />
              </FormField>
              <FormField id="slideEndsAt" label="Termina em" hint="Opcional." error={errors.endsAt}>
                <Input
                  id="slideEndsAt"
                  type="datetime-local"
                  value={values.endsAt}
                  onChange={(e) => set('endsAt', e.target.value)}
                />
              </FormField>
            </div>
            <p className="text-sm text-muted-foreground">
              {values.active
                ? 'Sem datas, fica na home até ser desligado. Com datas, entra e sai sozinho.'
                : 'Desligado: não aparece na home.'}
            </p>
          </FormCard>

          <FormCard title="Prévia">
            <div aria-label="Prévia do slide" className="overflow-hidden rounded-lg border border-border">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no admin, sem otimizador
                <img src={cover} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  Sem foto
                </div>
              )}
              <div className="space-y-1 p-3">
                {values.eyebrow.trim() && (
                  <p className="text-xs tracking-wider text-muted-foreground uppercase">{values.eyebrow.trim()}</p>
                )}
                <p className="font-medium">{values.title.trim() || 'Título do slide'}</p>
                {values.description.trim() && <p className="text-sm">{values.description.trim()}</p>}
                {(hasLink || hasWhatsapp) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {hasLink && (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        {values.linkLabel.trim()}
                      </span>
                    )}
                    {hasWhatsapp && (
                      <span className="rounded-full border border-border px-3 py-1 text-xs">
                        {values.whatsappLabel.trim() || 'Falar no WhatsApp'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </FormCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          {save.error && <ErrorText className="mr-auto">{save.error}</ErrorText>}
          {slide && dirty && !save.error && (
            <p className="mr-auto text-sm text-muted-foreground">Alterações não salvas</p>
          )}
          {slide && dirty && (
            <Button type="button" variant="outline" onClick={discard} disabled={save.isPending}>
              Descartar alterações
            </Button>
          )}
          <Button type="submit" loading={save.isPending} loadingText="Salvando..." disabled={!canSave}>
            {slide ? 'Salvar' : 'Criar destaque'}
          </Button>
        </div>
      </div>
    </form>
  );
}
