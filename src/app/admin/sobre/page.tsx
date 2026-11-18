'use client';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { IMAGE_UPLOAD } from '@/features/admin/lib/image-upload';
import { DEFAULT_ABOUT } from '@/features/site/components/About';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FormCard } from '@/features/admin/components/FormCard';
import { FormField } from '@/features/admin/components/FormField';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import type { AboutContent } from '@/features/admin/types/admin';

/** Os limites da API (`UpdateAboutDto`). */
const LIMITS = { title: 100, text: 2000, instagramLabel: 40 } as const;

interface Values {
  title: string;
  text: string;
  instagramLabel: string;
}

/** Nunca salvo: o formulário começa com o texto que o site mostra hoje. */
function valuesOf(about: AboutContent): Values {
  if (!about.configured) {
    return {
      title: DEFAULT_ABOUT.title,
      text: DEFAULT_ABOUT.paragraphs.join('\n\n'),
      instagramLabel: DEFAULT_ABOUT.instagramLabel ?? '',
    };
  }
  return { title: about.title ?? '', text: about.text ?? '', instagramLabel: about.instagramLabel ?? '' };
}

function AboutForm({ about, onSaved }: { about: AboutContent; onSaved: (saved: AboutContent) => void }) {
  const { apiFetch } = useApiClient();
  const save = useApiMutation('Erro ao salvar o "Sobre".');
  const [baseline, setBaseline] = useState(() => valuesOf(about));
  const [values, setValues] = useState(baseline);
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      image !== null ||
      removeImage ||
      (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== baseline[key]),
    [values, baseline, image, removeImage],
  );
  // Nunca salvo, dá pra salvar o texto de hoje do jeito que está.
  const canSave = !about.configured || dirty;

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
    setNotice(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    let problem: string | null = null;
    if (file && !(IMAGE_UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
      problem = `"${file.name}" precisa ser ${IMAGE_UPLOAD.typesLabel}.`;
    } else if (file && file.size > IMAGE_UPLOAD.maxBytes) {
      problem = `"${file.name}" passa de ${IMAGE_UPLOAD.maxLabel}.`;
    }
    setImageError(problem);
    setNotice(null);
    setImage(problem ? null : file);
    if (problem) e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.text.trim()) return;
    const form = new FormData();
    form.append('title', values.title.trim());
    form.append('text', values.text.trim());
    form.append('instagramLabel', values.instagramLabel.trim());
    if (image) form.append('image', image);
    else if (removeImage) form.append('removeImage', 'true');

    let saved: AboutContent | undefined;
    const ok = await save.run(async () => {
      saved = (await apiFetch('/site-content/about', { method: 'PUT', body: form })) as AboutContent;
    });
    if (!ok || !saved) return;
    const next = valuesOf(saved);
    setBaseline(next);
    setValues(next);
    setImage(null);
    setRemoveImage(false);
    setNotice('Alterações salvas. O site atualiza em até um minuto.');
    onSaved(saved);
  }

  function discard() {
    setValues(baseline);
    setImage(null);
    setRemoveImage(false);
    setImageError(null);
    save.clearError();
  }

  const photo = preview ?? (removeImage ? null : about.imageUrl);
  const missing = !values.title.trim() || !values.text.trim();

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      {!about.configured && (
        <p className="mb-4 text-sm text-muted-foreground">
          O site ainda mostra o texto padrão, que já está preenchido abaixo. Ao salvar, passa a mostrar o que estiver
          aqui.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FormCard title="Texto">
          <FormField id="aboutTitle" label="Título" error={!values.title.trim() ? 'Escreva o título.' : undefined}>
            <Input
              id="aboutTitle"
              value={values.title}
              maxLength={LIMITS.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </FormField>
          <FormField
            id="aboutText"
            label="Texto"
            hint="Deixe uma linha em branco entre um parágrafo e outro."
            error={!values.text.trim() ? 'Escreva o texto.' : undefined}
          >
            <Textarea
              id="aboutText"
              value={values.text}
              maxLength={LIMITS.text}
              onChange={(e) => set('text', e.target.value)}
              rows={8}
              required
            />
          </FormField>
          <FormField
            id="aboutInstagram"
            label="Texto do link para o Instagram"
            hint="Vazio = sem link para o Instagram."
          >
            <Input
              id="aboutInstagram"
              value={values.instagramLabel}
              maxLength={LIMITS.instagramLabel}
              placeholder="@daverdinha_"
              onChange={(e) => set('instagramLabel', e.target.value)}
            />
          </FormField>
        </FormCard>

        <FormCard title="Foto">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no admin, sem otimizador
            <img src={photo} alt="" className="aspect-4/3 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex aspect-4/3 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
          <FormField
            id="aboutImage"
            label="Trocar a foto"
            hint={`${IMAGE_UPLOAD.typesLabel}, até ${IMAGE_UPLOAD.maxLabel}.`}
            error={imageError ?? undefined}
          >
            <Input id="aboutImage" type="file" accept={IMAGE_UPLOAD.mimeTypes.join(',')} onChange={handleImage} />
          </FormField>
          {about.imageUrl && !image && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => {
                  setNotice(null);
                  setRemoveImage(e.target.checked);
                }}
                className="h-4 w-4 accent-primary"
              />
              Remover a foto atual
            </label>
          )}
        </FormCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          {save.error && <ErrorText className="mr-auto">{save.error}</ErrorText>}
          {about.configured && dirty && !save.error && (
            <p className="mr-auto text-sm text-muted-foreground">Alterações não salvas</p>
          )}
          {dirty && (
            <Button type="button" variant="outline" onClick={discard} disabled={save.isPending}>
              Descartar alterações
            </Button>
          )}
          <Button type="submit" loading={save.isPending} loadingText="Salvando..." disabled={!canSave || missing}>
            Salvar
          </Button>
        </div>
      </div>
    </form>
  );
}

/** A seção "Sobre" da home: título, texto, foto e o link para o Instagram. */
export default function SobrePage() {
  const { data, isLoading, error } = useApiResource<AboutContent>('/site-content/about');
  const [current, setCurrent] = useState<AboutContent | null>(null);
  const about = current ?? data;

  return (
    <div>
      <PageHeader title="Sobre" />
      <p className="mt-2 text-sm text-muted-foreground">A seção &quot;Sobre&quot; da home do site.</p>
      <div className="mt-6">
        {isLoading && <LoadingState />}
        {!isLoading && !about && <ErrorAlert>{error ?? 'Não foi possível carregar o "Sobre".'}</ErrorAlert>}
        {about && <AboutForm about={about} onSaved={setCurrent} />}
      </div>
    </div>
  );
}
