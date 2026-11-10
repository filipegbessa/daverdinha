import { Navigation } from 'lucide-react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { cn } from '@/lib/utils';

/** Mapa do Google pra um endereço. Só carrega quando o visitante rola até ele (`loading="lazy"`). */
export function MapEmbed({ address, title, className }: { address: string; title: string; className?: string }) {
  return (
    <iframe
      title={title}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
      className={cn('aspect-16/10 w-full rounded-2xl border-0 shadow-card', className)}
      loading="lazy"
    />
  );
}

/** Abre a rota no Google Maps até o destino. */
export function DirectionsButton({ destination, className }: { destination: string; className?: string }) {
  return (
    <SiteButton
      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
      target="_blank"
      rel="noopener"
      size="sm"
      className={className}
    >
      <Navigation className="size-4" aria-hidden="true" />
      Como chegar
    </SiteButton>
  );
}
