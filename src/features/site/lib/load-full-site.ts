import type { FullSiteData } from '@/features/site/components/FullSite';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { homeHref } from '@/features/site/lib/paths';
import { getActiveCategories, getActiveProducts, getUpcomingEvents } from '@/features/site/lib/public-api';

/** Tudo o que a home completa mostra, buscado em paralelo. Nenhuma dessas chamadas lança. */
export async function loadFullSite(): Promise<FullSiteData> {
  const [zones, categories, products, events] = await Promise.all([
    getCoveredDeliveryZones(),
    getActiveCategories(),
    getActiveProducts(),
    getUpcomingEvents(),
  ]);
  return { home: homeHref(), zones, categories, products, events };
}
