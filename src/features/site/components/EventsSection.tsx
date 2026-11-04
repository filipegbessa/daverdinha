import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AGENDA_HREF } from '@/features/site/lib/paths';
import { Carousel } from '@/features/site/components/Carousel';
import { EventCard } from '@/features/site/components/EventCard';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import type { SiteEvent } from '@/features/site/types/event';

/** Um card quase inteiro no celular (a ponta do próximo mostra que dá pra deslizar), 2 no tablet, 3 no desktop. */
const EVENT_ITEM_WIDTH = 'w-[85%] sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]';

/** Lista de eventos: "Próximos eventos" na home e "Outros eventos" na página de um evento. */
export function EventsSection({
  events,
  title = 'Próximos eventos',
  className,
}: {
  events: SiteEvent[];
  title?: string;
  className?: string;
}) {
  if (events.length === 0) return null;

  return (
    <section id="agenda" className={cn('scroll-mt-24 px-6 py-14 md:py-24', className)}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <Eyebrow>Agenda</Eyebrow>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
          </div>
          <Link href={AGENDA_HREF} className="text-sm font-semibold text-moss underline underline-offset-4">
            Ver agenda completa
          </Link>
        </div>
        <div className="mt-8">
          <Carousel label={title} itemClassName={EVENT_ITEM_WIDTH}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
