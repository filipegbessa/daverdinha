'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroSlideView } from '@/features/site/components/HeroSlideView';
import type { HeroSlide } from '@/features/site/types/hero-slide';

const ROTATE_INTERVAL_MS = 7000;

/**
 * Slideshow do topo, pra quando há mais de um slide (com um só, o `Hero`
 * nem carrega este componente).
 *
 * Todos os slides vão no HTML, empilhados na mesma célula da grade: a altura
 * é a do maior (a página não pula ao trocar) e o Google lê todos, com o H1
 * sempre no primeiro. Os escondidos ficam `inert`, fora do teclado e do
 * leitor de tela.
 *
 * Gira sozinho a cada 7 s, para enquanto o mouse ou o foco estão em cima, e
 * tem botão de pausa (a WCAG exige pra conteúdo que se mexe sozinho). Quem
 * pediu menos movimento no sistema não vê troca automática.
 */
export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (paused || hovering) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, hovering, slides.length]);

  const go = (i: number) => setIndex((i + slides.length) % slides.length);
  const control =
    'flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-moss/10 hover:text-moss';

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="px-6 pt-10 pb-8 md:pt-16 md:pb-10"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="grid">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${slides.length}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn(
              '[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <HeroSlideView slide={slide} isFirst={i === 0} />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl items-center justify-center gap-1 md:justify-start">
        <button type="button" onClick={() => go(index - 1)} aria-label="Slide anterior" className={control}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ir para o slide ${i + 1} de ${slides.length}`}
            aria-current={i === index}
            className="flex size-9 cursor-pointer items-center justify-center"
          >
            <span
              className={cn(
                'block h-2 rounded-full transition-all',
                i === index ? 'w-6 bg-moss' : 'w-2 bg-moss-line hover:bg-moss/50',
              )}
            />
          </button>
        ))}
        <button type="button" onClick={() => go(index + 1)} aria-label="Próximo slide" className={control}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Continuar a troca de slides' : 'Pausar a troca de slides'}
          className={control}
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
