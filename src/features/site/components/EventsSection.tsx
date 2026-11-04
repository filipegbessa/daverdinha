import Link from 'next/link';
import { AGENDA_HREF } from '@/features/site/lib/paths';
import { EventCard } from '@/features/site/components/EventCard';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import type { SiteEvent } from '@/features/site/types/event';

const HOME_LIMIT = 3;

export function EventsSection({ events }: { events: SiteEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section id="agenda" className="scroll-mt-24 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Agenda</Eyebrow>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Próximos eventos</h2>
          </div>
          <Link href={AGENDA_HREF} className="text-sm font-semibold text-moss underline underline-offset-4">
            Ver agenda completa
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
          {events.slice(0, HOME_LIMIT).map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
