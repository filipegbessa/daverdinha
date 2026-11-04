'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Pause, Play } from 'lucide-react';
import { formatEventShort } from '@/features/site/lib/format';
import type { SiteEvent } from '@/features/site/types/event';

const ROTATE_INTERVAL_MS = 6000;

type BarEvent = Pick<SiteEvent, 'id' | 'title' | 'startsAt'> & { href: string };

/**
 * A faixa acima do cabeçalho com os eventos marcados como "destacar no topo".
 * Some quando não há nenhum. Com dois ou mais, alterna entre eles — com botão
 * de pausa, que a WCAG exige pra qualquer conteúdo que se mexe sozinho por
 * mais de 5 segundos.
 */
export function EventBar({ events }: { events: BarEvent[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotates = events.length > 1;

  useEffect(() => {
    if (!rotates || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setInterval(() => setIndex((i) => (i + 1) % events.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [rotates, paused, events.length]);

  if (events.length === 0) return null;
  const event = events[index % events.length];

  return (
    <div className="bg-moss px-4 py-2 text-sm text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3">
        <Link
          href={event.href}
          className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center hover:underline"
          aria-live={paused ? 'polite' : 'off'}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/15 px-2.5 py-0.5 font-semibold">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatEventShort(event.startsAt)}
          </span>
          <span className="min-w-0">{event.title}</span>
          <span className="font-semibold underline underline-offset-4">Saiba mais →</span>
        </Link>
        {rotates && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Continuar a troca de eventos' : 'Pausar a troca de eventos'}
            className="shrink-0 cursor-pointer rounded-full p-1 hover:bg-paper/15"
          >
            {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
