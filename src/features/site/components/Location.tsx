import Link from 'next/link';
import { businessInfo } from '@/data/business';

export function Location() {
  const address = businessInfo.address.formatted;
  const mapsQuery = encodeURIComponent(`${businessInfo.name}, ${address}`);
  const embedQuery = encodeURIComponent(address);

  return (
    <section className="px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">Onde estamos</h2>
      <p className="mt-2 text-ink-soft">{address}</p>
      <Link
        href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
        target="_blank"
        className="mt-2 inline-block font-medium text-berry underline underline-offset-4"
      >
        Ver no Google Maps
      </Link>
      <iframe
        title="Mapa de localização da Da Verdinha"
        src={`https://maps.google.com/maps?q=${embedQuery}&output=embed`}
        className="mx-auto mt-6 h-64 w-full max-w-2xl border-0"
        loading="lazy"
      />
    </section>
  );
}
