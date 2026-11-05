'use client';
import { useEffect, useState } from 'react';
import { ErrorText } from '@/features/admin/components/StatusMessage';

// Os mesmos limites que a API aplica (`products.controller.ts`): conferir
// aqui só poupa a cliente de esperar o upload pra descobrir o erro.
export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImages(files: File[]): string | null {
  if (files.length > MAX_IMAGES) return `Escolha no máximo ${MAX_IMAGES} fotos.`;
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `"${file.name}" precisa ser JPEG, PNG ou WebP.`;
    if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" passa de 5 MB.`;
  }
  return null;
}

/**
 * Escolha de fotos do produto. Sem arquivos escolhidos mostra as fotos atuais
 * (`currentImages`); escolher novas substitui todas — é como a API funciona,
 * e o aviso diz isso antes de a cliente salvar.
 */
export function ProductImagesInput({
  currentImages,
  files,
  onChange,
}: {
  currentImages: string[];
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return;
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    const problem = validateImages(chosen);
    setError(problem);
    onChange(problem ? [] : chosen);
    if (problem) e.target.value = '';
  }

  const shown = files.length > 0 ? previews : currentImages;

  return (
    <div>
      <label htmlFor="productImages" className="mb-1 block font-medium">
        Fotos
      </label>
      <input
        id="productImages"
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        onChange={handleChange}
        aria-describedby="productImagesHelp"
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:font-medium"
      />
      <p id="productImagesHelp" className="mt-1 text-sm text-ink-soft">
        Até {MAX_IMAGES} fotos (JPEG, PNG ou WebP, até 5 MB cada). A primeira é a capa.
        {currentImages.length > 0 && ' Escolher novas fotos substitui as atuais.'}
      </p>
      {error && <ErrorText className="mt-1 text-sm">{error}</ErrorText>}
      {shown.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={files.length > 0 ? 'Fotos novas' : 'Fotos atuais'}>
          {shown.map((src, index) => (
            <li key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de blob: local, fora do otimizador do Next */}
              <img src={src} alt={`Foto ${index + 1}`} className="size-16 rounded-lg border border-sand-line object-cover" />
              {index === 0 && (
                <span className="absolute bottom-0.5 left-0.5 rounded bg-ink/70 px-1 text-[10px] text-paper">capa</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
