import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { ContactLink } from '@/features/site/components/ContactLink';
import { siteButtonClass } from '@/features/site/components/SiteButton';
import { EventCard } from '@/features/site/components/EventCard';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { Location } from '@/features/site/components/Location';
import { Pagination } from '@/features/site/components/Pagination';
import { ProductsSection } from '@/features/site/components/ProductsSection';
import { isSample } from '@/features/site/data/samples';
import { AGENDA_HREF } from '@/features/site/lib/paths';
import { getFeaturedProducts, getUpcomingEvents } from '@/features/site/lib/public-api';
import { paginate } from '@/features/site/lib/pagination';
import { pageMetadata } from '@/features/site/lib/seo';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { UPCOMING_EVENTS_MESSAGE } from '@/features/site/lib/whatsapp-messages';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Agenda · Oficinas e eventos da Daverdinha no Rio de Janeiro',
    description: 'Oficinas de terrário, kokedama e outros encontros no ateliê da Daverdinha, no Santo Cristo.',
    path: AGENDA_HREF,
  });
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AgendaPage({ searchParams }: Props) {
  const [{ page: pageParam }, allEvents, featured] = await Promise.all([
    searchParams,
    getUpcomingEvents(),
    getFeaturedProducts(),
  ]);
  const { items: events, page, totalPages } = paginate(allEvents, pageParam);
  const { home, storeEnabled } = await shellProps();

  return (
    <SiteShell home={home} storeEnabled={storeEnabled} preview={allEvents.some(isSample) || featured.some(isSample)}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: 'Eventos', path: AGENDA_HREF },
            ]}
          />
          <Eyebrow>Eventos</Eyebrow>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink md:text-4xl">Oficinas e eventos</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Encontros no ateliê e fora dele. A inscrição é pelo WhatsApp, direto na página de cada evento.
          </p>
          {events.length === 0 ? (
            <div className="mt-10 space-y-4">
              <p className="text-ink-soft">Nenhum evento marcado agora. Quer saber do próximo?</p>
              <ContactLink
                href={getWhatsAppUrl(UPCOMING_EVENTS_MESSAGE)}
                channel="whatsapp"
                location="agenda"
                className={siteButtonClass({ size: 'sm' })}
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
          <Pagination page={page} totalPages={totalPages} basePath={AGENDA_HREF} />
        </div>
      </section>

      <ProductsSection products={featured} cardVariant="compact" />
      <Location />
    </SiteShell>
  );
}
