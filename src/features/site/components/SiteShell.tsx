import { MessageCircle } from 'lucide-react';
import { isSample } from '@/features/site/data/samples';
import { eventHref } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { EventBar } from '@/features/site/components/EventBar';
import { Footer } from '@/features/site/components/Footer';
import { Header, WHATSAPP_GREETING } from '@/features/site/components/Header';
import type { SiteEvent } from '@/features/site/types/event';

/**
 * A moldura de toda página do site completo: faixa de eventos, cabeçalho,
 * rodapé e o botão flutuante de WhatsApp. Recebe tudo pronto (é síncrono) —
 * quem busca os dados é a página.
 */
export function SiteShell({
  home,
  events,
  showPreviewNotice = false,
  children,
}: {
  home: string;
  events: SiteEvent[];
  /** Algum dado da página é exemplo (ver `data/samples.ts`). */
  showPreviewNotice?: boolean;
  children: React.ReactNode;
}) {
  const barEvents = events
    .filter((e) => e.highlight)
    .map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, href: eventHref(e) }));
  const preview = showPreviewNotice || events.some(isSample);

  return (
    <>
      {preview && (
        <p className="bg-berry px-4 py-1.5 text-center text-xs font-medium text-paper">
          Prévia do site: os produtos, preços e eventos são exemplos para validar o layout.
        </p>
      )}
      <EventBar events={barEvents} />
      <Header home={home} />
      <main>{children}</main>
      <Footer home={home} />
      <ContactLink
        href={getWhatsAppUrl(WHATSAPP_GREETING)}
        channel="whatsapp"
        location="floating"
        aria-label="Falar no WhatsApp"
        className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-moss text-paper shadow-soft sm:hidden"
      >
        <MessageCircle className="size-6" aria-hidden="true" />
      </ContactLink>
    </>
  );
}
