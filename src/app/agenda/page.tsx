import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { SiteShell } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { ContactLink } from '@/features/site/components/ContactLink';
import { EventCard } from '@/features/site/components/EventCard';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { AGENDA_HREF, homeHref } from '@/features/site/lib/paths';
import { getUpcomingEvents } from '@/features/site/lib/public-api';
import { pageMetadata } from '@/features/site/lib/seo';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Agenda · Oficinas e eventos da Daverdinha no Rio de Janeiro',
    description: 'Oficinas de terrário, kokedama e outros encontros no ateliê da Daverdinha, no Santo Cristo.',
    path: AGENDA_HREF,
  });
}

export default async function AgendaPage() {
  const events = await getUpcomingEvents();
  const home = homeHref();

  return (
    <SiteShell home={home} events={events}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Agenda', path: AGENDA_HREF },
            ]}
          />
          <Eyebrow>Agenda</Eyebrow>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">Oficinas e eventos</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Encontros no ateliê e fora dele. A inscrição é pelo WhatsApp, direto na página de cada evento.
          </p>
          {events.length === 0 ? (
            <div className="mt-10 space-y-4">
              <p className="text-ink-soft">Nenhum evento marcado agora. Quer saber do próximo?</p>
              <ContactLink
                href={getWhatsAppUrl('Oi! Quero saber dos próximos eventos da Daverdinha 🌱')}
                channel="whatsapp"
                location="agenda"
                className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 font-semibold text-paper hover:bg-moss/90"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Me avise pelo WhatsApp
              </ContactLink>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
