import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, ExternalLink, MapPin, MessageCircle, Ticket } from 'lucide-react';
import { businessInfo } from '@/data/business';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton, siteButtonClass } from '@/features/site/components/SiteButton';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { JsonLd } from '@/features/site/components/JsonLd';
import { eventPlace } from '@/features/site/components/EventCard';
import { EventsSection } from '@/features/site/components/EventsSection';
import { Location } from '@/features/site/components/Location';
import { isSample } from '@/features/site/data/samples';
import { formatEventPrice, formatEventShort, formatEventWhen } from '@/lib/format';
import { AGENDA_HREF, eventHref, homeHref } from '@/features/site/lib/paths';
import { getEventBySlug, getUpcomingEvents } from '@/features/site/lib/public-api';
import { pageMetadata } from '@/features/site/lib/seo';
import { eventJsonLd } from '@/features/site/lib/structured-data';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { signupMessage } from '@/features/site/lib/whatsapp-messages';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  return pageMetadata({
    title: `${event.title} · ${formatEventShort(event.startsAt)} · Daverdinha`,
    description: event.description.slice(0, 160),
    path: eventHref(event),
    image: event.imageUrl ?? undefined,
  });
}

/**
 * Evento que já passou continua no ar, com aviso: um link antigo
 * compartilhado no Instagram cai numa página que explica, não num 404.
 *
 * Abaixo do evento: os outros eventos da agenda e onde fica o ateliê —
 * quem chegou por um evento continua navegando.
 */
export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [event, upcoming] = await Promise.all([getEventBySlug(slug), getUpcomingEvents()]);
  if (!event) notFound();

  const past = new Date(event.endsAt).getTime() < Date.now();
  const home = homeHref();
  const atAtelier = event.locationName === null;
  const address = atAtelier ? businessInfo.address.formatted : event.locationAddress;
  const others = upcoming.filter((e) => e.id !== event.id);
  const priceText = [formatEventPrice(event.price), event.spots ? `${event.spots} vagas` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <SiteShell home={home} preview={isSample(event)}>
      <JsonLd data={eventJsonLd(event)} />
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Eventos', path: AGENDA_HREF },
              { name: event.title, path: eventHref(event) },
            ]}
          />
          <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
            <ImagePlaceholder
              src={event.imageUrl ?? undefined}
              alt={event.title}
              priority
              className="aspect-4/3 rounded-[2rem_0.75rem_2rem_0.75rem] shadow-card"
            />
            <div>
              {past && (
                <p className="mb-4 inline-block rounded-full bg-sand px-3 py-1 text-sm font-medium text-berry">
                  Este evento já aconteceu
                </p>
              )}
              <h1 className="font-serif text-3xl font-semibold text-balance text-ink md:text-4xl">{event.title}</h1>
              <ul aria-label="Detalhes do evento" className="mt-5 space-y-2.5">
                <li className="flex items-start gap-2.5 text-ink">
                  <CalendarDays className="mt-0.5 size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                  {formatEventWhen(event.startsAt, event.endsAt)}
                </li>
                <li className="flex items-start gap-2.5 text-ink">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                  <div>
                    <span className="inline-block rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-semibold text-moss">
                      {eventPlace(event)}
                    </span>
                    {address && <p className="mt-1">{address}</p>}
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-ink">
                  <Ticket className="mt-0.5 size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                  {priceText}
                </li>
              </ul>
              <p className="mt-6 leading-relaxed whitespace-pre-line text-ink-soft">{event.description}</p>

              {!past &&
                (event.ctaUrl ? (
                  <SiteButton href={event.ctaUrl} target="_blank" rel="noopener" className="mt-8 w-full sm:w-auto">
                    <ExternalLink className="size-5" aria-hidden="true" />
                    Fazer inscrição
                  </SiteButton>
                ) : (
                  <ContactLink
                    href={getWhatsAppUrl(signupMessage(event))}
                    channel="whatsapp"
                    location="event"
                    className={siteButtonClass({ className: 'mt-8 w-full sm:w-auto' })}
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    Quero me inscrever
                  </ContactLink>
                ))}
            </div>
          </div>
        </div>
      </section>

      <EventsSection events={others} title="Outros eventos" cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
