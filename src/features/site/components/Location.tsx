import { businessInfo } from '@/data/business';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { DirectionsButton, MapEmbed } from '@/features/site/components/MapEmbed';

export function Location() {
  const { address, hours } = businessInfo;

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
          <DirectionsButton destination={`${businessInfo.name}, ${address.formatted}`} className="mt-6" />
        </div>
        <MapEmbed address={address.formatted} title="Mapa de localização da Daverdinha" />
      </div>
    </section>
  );
}
