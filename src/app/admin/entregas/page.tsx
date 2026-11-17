'use client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { DeliveryAreasSection } from '@/features/admin/components/DeliveryAreasSection';
import type { DeliveryAreaAdmin, DeliveryLocation, DeliveryZoneAreas } from '@/features/admin/types/admin';

/**
 * Entregas: as áreas de entrega, cada uma com valor e bairros. Desde
 * 2026-11-17 é a única lista que decide onde se entrega, no site e no bot;
 * a antiga lista "Bairros atendidos" saiu. Bairro fora de qualquer área não
 * é atendido. A lista de bairros (`/delivery-locations`) vem junto porque o
 * modal da área escolhe entre os bairros da zona.
 */
export default function EntregasPage() {
  const {
    data: locations,
    isLoading,
    error: loadError,
    refetch: load,
  } = useApiResource<DeliveryLocation[]>('/delivery-locations');
  const {
    data: zoneAreas,
    isRefreshing: areasRefreshing,
    error: areasError,
    refetch: loadAreas,
  } = useApiResource<DeliveryZoneAreas[]>('/delivery-areas');
  const areas: DeliveryAreaAdmin[] = zoneAreas?.flatMap((z) => z.areas) ?? [];

  return (
    <div>
      <PageHeader title="Entregas" />
      {isLoading && <LoadingState />}
      {!isLoading && !locations && <ErrorAlert>{loadError ?? 'Não foi possível carregar os bairros.'}</ErrorAlert>}
      {areasError && <ErrorAlert>{areasError}</ErrorAlert>}
      {locations && zoneAreas && (
        <DeliveryAreasSection
          areas={areas}
          locations={locations}
          busy={areasRefreshing}
          onChanged={() => {
            load();
            loadAreas();
          }}
        />
      )}
    </div>
  );
}
