'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

/**
 * As fotos do produto: a grande e as miniaturas. Tocar na grande abre a foto
 * inteira (sem corte) em tela cheia, com setas e teclado pra passar, porque
 * planta se escolhe pelo detalhe da folha.
 */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const many = images.length > 1;
  const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="space-y-3">
      {images[index] ? (
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Ampliar foto"
          className="group relative block w-full cursor-zoom-in rounded-[2rem_0.75rem_2rem_0.75rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss"
        >
          <ImagePlaceholder
            src={images[index]}
            alt={name}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-square rounded-[2rem_0.75rem_2rem_0.75rem] shadow-card"
          />
          <span
            aria-hidden="true"
            className="absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow-card transition group-hover:scale-105"
          >
            <Maximize2 className="size-5" />
          </span>
        </button>
      ) : (
        <ImagePlaceholder alt={name} className="aspect-square rounded-[2rem_0.75rem_2rem_0.75rem] shadow-card" />
      )}
      {many && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === index}
                className={cn(
                  'block cursor-pointer overflow-hidden rounded-xl border-2',
                  i === index ? 'border-moss' : 'border-transparent opacity-75 hover:opacity-100',
                )}
              >
                <ImagePlaceholder src={src} alt="" sizes="80px" className="size-20" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomed && images[index] && (
        <Dialog open onOpenChange={setZoomed}>
          <DialogContent
            showCloseButton={false}
            className="h-[90dvh] max-w-[95vw] border-none bg-ink/95 p-2 sm:max-w-[95vw]"
            onKeyDown={(e) => {
              if (!many) return;
              if (e.key === 'ArrowRight') step(1);
              if (e.key === 'ArrowLeft') step(-1);
            }}
          >
            <DialogTitle className="sr-only">
              {name}
              {many && `, foto ${index + 1} de ${images.length}`}
            </DialogTitle>
            <div className="relative h-full w-full">
              <Image src={images[index]} alt={name} fill sizes="95vw" className="object-contain" />
            </div>
            <DialogClose
              aria-label="Fechar"
              className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-paper/90 text-ink"
            >
              <X className="size-6" aria-hidden="true" />
            </DialogClose>
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Próxima foto"
                  className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-paper/90 px-3 py-1 text-sm text-ink tabular-nums">
                  {index + 1} / {images.length}
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
