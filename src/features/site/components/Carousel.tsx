'use client';

import { Children, isValidElement, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 2 por tela no celular, 3 no tablet, 4 no desktop, com `gap-4` entre eles. */
const DEFAULT_ITEM_WIDTH = 'w-[calc(50%-0.5rem)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]';

/**
 * Uma fileira que vira carrossel só quando precisa: enquanto os itens cabem
 * na largura, é uma linha comum, sem setas. Quando passam do que cabe (que
 * muda com a tela), aparecem as setas e dá pra deslizar com o dedo.
 *
 * Deslizar é rolagem nativa com `scroll-snap`: funciona sem JavaScript, com
 * teclado e com leitor de tela. O script só cuida das setas.
 */
export function Carousel({
  label,
  children,
  itemClassName = DEFAULT_ITEM_WIDTH,
}: {
  label: string;
  children: React.ReactNode;
  itemClassName?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ overflow: false, atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setState({ overflow: max > 1, atStart: track.scrollLeft <= 1, atEnd: track.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    track.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(track);
    return () => {
      track.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure]);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: direction * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }

  const arrow =
    'absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-moss-line bg-paper text-ink shadow-card transition-opacity hover:text-moss disabled:pointer-events-none disabled:opacity-0 sm:flex';

  return (
    <div role="region" aria-roledescription="carrossel" aria-label={label} className="relative">
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.toArray(children).map((child, i) => (
          <li key={isValidElement(child) ? (child.key ?? i) : i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
      {state.overflow && (
        <>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={state.atStart}
            aria-label="Anteriores"
            className={cn(arrow, '-left-4')}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={state.atEnd}
            aria-label="Próximos"
            className={cn(arrow, '-right-4')}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
