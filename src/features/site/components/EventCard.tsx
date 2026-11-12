import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { eventCalendar, formatEventPrice, formatEventWhen } from '@/lib/format';
import { eventHref } from '@/features/site/lib/paths';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { SiteEvent } from '@/features/site/types/event';

export function eventPlace(event: Pick<SiteEvent, 'locationName'>): string {
  return event.locationName ?? 'No ateliê';
}

/**
 * Preço e vagas numa linha: "R$ 120,00 · 8 vagas". Com venda pelo site, as
 * vagas são as que sobram ("Restam 3 vagas") ou "Esgotado".
 */
export function eventDetails(
  event: Pick<SiteEvent, 'price' | 'spots' | 'ticketSales' | 'spotsLeft' | 'soldOut'>,
): string {
  let spots: string | null = event.spots ? `${event.spots} vagas` : null;
  if (event.soldOut) spots = 'Esgotado';
  else if (event.ticketSales && event.spotsLeft !== null) {
    spots = event.spotsLeft === 1 ? 'Resta 1 vaga' : `Restam ${event.spotsLeft} vagas`;
  }
  return [formatEventPrice(event.price), spots].filter(Boolean).join(' · ');
}

/** `full`: foto grande, usada na listagem e na página do evento. `compact`: card antigo, só texto, usado na home. */
export function EventCard({ event, variant = 'full' }: { event: SiteEvent; variant?: 'full' | 'compact' }) {
  const { day, month } = eventCalendar(event.startsAt);
  const details = eventDetails(event);

  if (variant === 'compact') {
    return (
      <Link
        href={eventHref(event)}
        className="grid h-full grid-cols-[4rem_1fr] gap-4 rounded-2xl border border-moss-line bg-paper p-4 shadow-card transition-shadow hover:shadow-soft"
      >
        <div className="self-start rounded-xl bg-moss py-2 text-center leading-tight text-paper" aria-hidden="true">
          <span className="block text-[0.65rem] tracking-widest uppercase opacity-85">{month}</span>
          <span className="font-serif text-2xl font-semibold">{day}</span>
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-semibold text-ink">{event.title}</h3>
          <p className="text-sm text-ink-soft">{formatEventWhen(event.startsAt, event.endsAt)}</p>
          <p className="text-sm text-ink-soft">{eventPlace(event)}</p>
          <p className="text-sm text-berry">{details}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={eventHref(event)}
      className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-moss-line bg-paper shadow-card transition-shadow hover:shadow-soft"
    >
      <div className="relative">
        <ImagePlaceholder
          src={event.imageUrl ?? undefined}
          alt={event.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
          className="aspect-4/3 transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span
          className="absolute top-3 left-3 rounded-xl bg-paper/95 px-2.5 py-1.5 text-center leading-tight text-ink shadow-soft"
          aria-hidden="true"
        >
          <span className="block text-[0.6rem] tracking-widest text-ink-soft uppercase">{month}</span>
          <span className="font-serif text-lg font-semibold">{day}</span>
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 p-4">
        <h3 className="font-semibold text-ink">{event.title}</h3>
        <p className="text-sm text-ink-soft">{formatEventWhen(event.startsAt, event.endsAt)}</p>
        <p className="text-sm text-ink-soft">{eventPlace(event)}</p>
        <p className="text-sm text-berry">{details}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-moss">
          Ver evento
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
