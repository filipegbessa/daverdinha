import { AtSign, Mail, MessageCircle } from 'lucide-react';
import { businessInfo } from '@/data/business';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { WHATSAPP_GREETING } from '@/features/site/components/Header';
import { DirectionsButton, MapEmbed } from '@/features/site/components/MapEmbed';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Location() {
  const { address, hours, contact } = businessInfo;

  return (
    <section id="visite" className="scroll-mt-24 bg-sand px-6 py-14 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <div>
          <Eyebrow>Visite</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Onde estamos</h2>
          <address className="mt-3 text-ink not-italic">
            {address.street} · {address.neighborhood}
            <br />
            {address.city} - {address.state}, {address.zipCode}
          </address>
          {hours.length > 0 && (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm tabular-nums">
              {hours.map((h) => (
                <div key={h.label} className="contents">
                  <dt className="text-ink-soft">{h.label}</dt>
                  <dd>
                    {h.opens} às {h.closes}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="mt-4 space-y-2 text-sm text-ink">
            <li className="flex items-center gap-2">
              <MessageCircle className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <ContactLink
                href={getWhatsAppUrl(WHATSAPP_GREETING)}
                channel="whatsapp"
                location="onde-estamos"
                className="underline underline-offset-4 hover:text-ink-soft"
              >
                WhatsApp {contact.phone.display}
              </ContactLink>
            </li>
            <li className="flex items-center gap-2">
              <AtSign className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <ContactLink
                href={contact.instagram.url}
                channel="instagram"
                location="onde-estamos"
                className="underline underline-offset-4 hover:text-ink-soft"
              >
                {contact.instagram.handle}
              </ContactLink>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <ContactLink
                href={`mailto:${contact.email}`}
                channel="email"
                location="onde-estamos"
                className="underline underline-offset-4 hover:text-ink-soft"
              >
                {contact.email}
              </ContactLink>
            </li>
          </ul>
          <DirectionsButton destination={`${businessInfo.name}, ${address.formatted}`} className="mt-6" />
        </div>
        <MapEmbed address={address.formatted} title="Mapa de localização da Daverdinha" />
      </div>
    </section>
  );
}
