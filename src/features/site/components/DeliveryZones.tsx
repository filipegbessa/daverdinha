import { DELIVERY_ZONES } from '@/features/site/lib/delivery-zones';

export function DeliveryZones() {
  return (
    <section className="bg-sand px-6 py-16">
      <h2 className="text-center text-2xl font-semibold">Onde entregamos</h2>
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
        {DELIVERY_ZONES.map((zone) => (
          <div key={zone.zona} className="rounded border border-sand-line bg-paper p-4">
            <h3 className="font-medium text-berry">{zone.zona}</h3>
            <p className="mt-1 text-sm text-ink-soft">{zone.bairros.join(', ')}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
