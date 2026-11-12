import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { TicketCheckout } from '@/features/store/components/TicketCheckout';
import { isSample } from '@/features/site/data/samples';
import { eventHref } from '@/features/site/lib/paths';
import { getEventBySlug } from '@/features/site/lib/public-api';
import { isFreeEvent } from '@/features/store/lib/tickets';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ quantidade?: string }>;
};

/** Página de cada comprador: nunca no Google nem no sitemap. */
export const metadata: Metadata = {
  title: 'Ingresso · Daverdinha',
  robots: { index: false, follow: false },
};

/**
 * O checkout do ingresso, aberto pelo botão da página do evento com a
 * quantidade escolhida lá (`?quantidade=`). Evento sem venda pelo site, ou
 * que já começou, volta pra página dele, que explica o que fazer.
 */
export default async function TicketCheckoutPage({ params, searchParams }: Props) {
  const [{ slug }, { quantidade }] = await Promise.all([params, searchParams]);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (!event.ticketSales || new Date(event.startsAt).getTime() <= Date.now()) redirect(eventHref(event));

  const shell = await shellProps();
  const free = isFreeEvent(event);

  return (
    <SiteShell {...shell} preview={isSample(event)}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Link
            href={eventHref(event)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-moss underline-offset-4 hover:underline"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {event.title}
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink md:text-4xl">
            {free ? 'Inscrição' : 'Comprar ingresso'}
          </h1>
          <div className="mt-8">
            <TicketCheckout event={event} initialQuantity={Number(quantidade ?? 1)} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
