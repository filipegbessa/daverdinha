import Link from 'next/link';
import { eventCalendar, formatEventPrice, formatEventWhen } from '@/features/site/lib/format';
import { eventHref } from '@/features/site/lib/paths';
import type { SiteEvent } from '@/features/site/types/event';

export function eventPlace(event: Pick<SiteEvent, 'locationName'>): string {
  return event.locationName ?? 'No ateliê';
}

export function EventCard({ event }: { event: SiteEvent }) {
  const { day, month } = eventCalendar(event.startsAt);
  const details = [formatEventPrice(event.price), event.spots ? `${event.spots} vagas` : null].filter(Boolean);

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
        <p className="text-sm text-berry">{details.join(' · ')}</p>
      </div>
    </Link>
  );
}
