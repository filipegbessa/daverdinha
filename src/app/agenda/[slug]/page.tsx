import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, ExternalLink, MapPin, MessageCircle, Ticket } from 'lucide-react';
import { businessInfo } from '@/data/business';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { ContactLink } from '@/features/site/components/ContactLink';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { JsonLd } from '@/features/site/components/JsonLd';
import { eventPlace } from '@/features/site/components/EventCard';
import { isSample } from '@/features/site/data/samples';
import { formatEventPrice, formatEventShort, formatEventWhen } from '@/features/site/lib/format';
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
 */
export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [event, upcoming] = await Promise.all([getEventBySlug(slug), getUpcomingEvents()]);
  if (!event) notFound();

  const past = new Date(event.endsAt).getTime() < Date.now();
  const home = homeHref();
  const address = event.locationName === null ? businessInfo.address.formatted : event.locationAddress;
  const facts = [
    { icon: CalendarDays, text: formatEventWhen(event.startsAt, event.endsAt) },
    { icon: MapPin, text: address ? `${eventPlace(event)} · ${address}` : eventPlace(event) },
    { icon: Ticket, text: [formatEventPrice(event.price), event.spots ? `${event.spots} vagas` : null].filter(Boolean).join(' · ') },
  ];

  return (
    <SiteShell home={home} events={upcoming} showPreviewNotice={isSample(event)}>
      <JsonLd data={eventJsonLd(event)} />
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Agenda', path: AGENDA_HREF },
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
              <ul className="mt-5 space-y-2.5">
                {facts.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-ink">
                    <Icon className="mt-0.5 size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-6 leading-relaxed whitespace-pre-line text-ink-soft">{event.description}</p>

              {!past &&
                (event.ctaUrl ? (
                  <a
                    href={event.ctaUrl}
                    target="_blank"
                    rel="noopener"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3.5 font-semibold text-paper shadow-card hover:bg-moss/90 sm:w-auto"
                  >
                    <ExternalLink className="size-5" aria-hidden="true" />
                    Fazer inscrição
                  </a>
                ) : (
                  <ContactLink
                    href={getWhatsAppUrl(signupMessage(event))}
                    channel="whatsapp"
                    location="event"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3.5 font-semibold text-paper shadow-card hover:bg-moss/90 sm:w-auto"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    Quero me inscrever
                  </ContactLink>
                ))}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
