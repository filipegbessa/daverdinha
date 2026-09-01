import { MapPin } from 'lucide-react';
import { DELIVERY_ZONES } from '@/features/site/lib/delivery-zones';
import { Eyebrow } from '@/features/site/components/Eyebrow';

export function DeliveryZones() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <Eyebrow>Entrega</Eyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Onde entregamos</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {DELIVERY_ZONES.map((zone) => (
            <div
              key={zone.zona}
              className="rounded-2xl border border-sand-line bg-sand p-6 text-left shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="flex items-center gap-2">
                <MapPin className="size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="font-medium text-berry">{zone.zona}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{zone.bairros.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
