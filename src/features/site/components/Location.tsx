import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { businessInfo } from '@/data/business';
import { Eyebrow } from '@/features/site/components/Eyebrow';

export function Location() {
  const address = businessInfo.address.formatted;
  const mapsQuery = encodeURIComponent(`${businessInfo.name}, ${address}`);
  const embedQuery = encodeURIComponent(address);

  return (
    <section className="px-6 py-16 text-center md:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Visite</Eyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Onde estamos</h2>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-ink-soft">
          <MapPin className="size-4 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
          {address}
        </p>
        <Link
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          className="mt-2 inline-block font-medium text-berry underline underline-offset-4"
        >
          Ver no Google Maps
        </Link>
        <iframe
          title="Mapa de localização da Daverdinha"
          src={`https://maps.google.com/maps?q=${embedQuery}&output=embed`}
          className="mx-auto mt-6 h-64 w-full rounded-2xl border-0 shadow-card"
          loading="lazy"
        />
      </div>
    </section>
  );
}
