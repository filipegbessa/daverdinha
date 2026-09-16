import { MapPin } from 'lucide-react';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import type { DeliveryZone } from '@/features/site/lib/delivery-zones';

export function DeliveryZones({ zones }: { zones: DeliveryZone[] }) {
  // No verified coverage, no section. Showing an empty "Onde entregamos" or
  // a stale fallback list is how the site ends up promising what the bot
  // then refuses.
  if (zones.length === 0) return null;

  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <Eyebrow>Entrega</Eyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Onde entregamos</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {zones.map((zone) => (
            <div
              key={zone.zone}
              className="rounded-2xl border border-sand-line bg-sand p-6 text-left shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="flex items-center gap-2">
                <MapPin className="size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="font-medium text-berry">{zone.zone}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{zone.bairros.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
