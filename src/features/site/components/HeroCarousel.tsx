'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { HeroSlideContent } from '@/features/site/components/HeroSlideContent';
import type { HeroSlide } from '@/features/site/types/hero-slide';

const ROTATE_INTERVAL_MS = 7000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="px-6 py-16 md:py-24">
      <HeroSlideContent slide={slides[index]} />
      <div className="mx-auto mt-6 flex max-w-6xl justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Ver destaque ${i + 1} de ${slides.length}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn('size-2.5 cursor-pointer rounded-full transition-colors', i === index ? 'bg-moss' : 'bg-moss-line hover:bg-moss/50')}
          />
        ))}
      </div>
    </section>
  );
}
