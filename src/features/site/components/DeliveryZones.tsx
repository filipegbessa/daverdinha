import { MapPin } from 'lucide-react';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { CepChecker } from '@/features/site/components/CepChecker';
import type { DeliveryZone } from '@/features/site/lib/delivery-zones';

export function DeliveryZones({ zones }: { zones: DeliveryZone[] }) {
  // No verified coverage, no section. Showing an empty "Onde entregamos" or
  // a stale fallback list is how the site ends up promising what the bot
  // then refuses.
  if (zones.length === 0) return null;

  return (
    <section id="entregas" className="scroll-mt-24 px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
        <div>
          <Eyebrow>Entrega</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Onde entregamos</h2>
          <p className="mt-3 text-ink-soft">
            Digite seu CEP ou procure seu bairro na lista. É a mesma lista que o atendimento do WhatsApp usa.
          </p>
          <div className="mt-6">
            <CepChecker />
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {zones.map((zone) => (
            <li key={zone.zone} className="rounded-2xl border border-sand-line bg-sand p-5 shadow-card">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="font-medium text-berry">{zone.zone}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{zone.bairros.join(', ')}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
