import { Navigation } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { businessInfo } from '@/data/business';
import { Eyebrow } from '@/features/site/components/Eyebrow';

export function Location() {
  const { address, hours } = businessInfo;
  const destination = encodeURIComponent(`${businessInfo.name}, ${address.formatted}`);
  const embedQuery = encodeURIComponent(address.formatted);

  return (
    <section id="visite" className="scroll-mt-24 bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
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
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
            target="_blank"
            rel="noopener"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'mt-6 gap-2 rounded-full bg-moss shadow-card hover:bg-moss/90',
            )}
          >
            <Navigation className="size-4" aria-hidden="true" />
            Como chegar
          </a>
        </div>
        {/* Só carrega quando o visitante rola até aqui (`loading="lazy"`), então não pesa na abertura da página. */}
        <iframe
          title="Mapa de localização da Daverdinha"
          src={`https://maps.google.com/maps?q=${embedQuery}&output=embed`}
          className="aspect-16/10 w-full rounded-2xl border-0 shadow-card"
          loading="lazy"
        />
      </div>
    </section>
  );
}
