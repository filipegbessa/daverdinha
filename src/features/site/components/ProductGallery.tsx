'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="space-y-3">
      <ImagePlaceholder
        src={images[index]}
        alt={name}
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="aspect-square rounded-[2rem_0.75rem_2rem_0.75rem] shadow-card"
      />
      {images.length > 1 && (
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
    </div>
  );
}
