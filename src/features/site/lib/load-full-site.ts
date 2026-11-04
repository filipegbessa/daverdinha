import type { FullSiteData } from '@/features/site/components/FullSite';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { homeHref } from '@/features/site/lib/paths';
import { getFeaturedProducts, getHeroSlides, getUpcomingEvents } from '@/features/site/lib/public-api';

/** Tudo o que a home completa mostra, buscado em paralelo. Nenhuma dessas chamadas lança. */
export async function loadFullSite(): Promise<FullSiteData> {
  const [slides, zones, featured, events] = await Promise.all([
    getHeroSlides(),
    getCoveredDeliveryZones(),
    getFeaturedProducts(),
    getUpcomingEvents(),
  ]);
  return { home: homeHref(), slides, zones, featured, events };
}
