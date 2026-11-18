import type { FullSiteData } from '@/features/site/components/FullSite';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { shellProps } from '@/features/site/components/SiteShell';
import { getFeaturedProducts, getHeroSlides, getUpcomingEvents } from '@/features/site/lib/public-api';
import { getFaqItems } from '@/features/site/lib/faq-context';

/** Tudo o que a home completa mostra, buscado em paralelo. Nenhuma dessas chamadas lança. */
export async function loadFullSite(): Promise<FullSiteData> {
  const [slides, zones, featured, events, shell, faq] = await Promise.all([
    getHeroSlides(),
    getCoveredDeliveryZones(),
    getFeaturedProducts(),
    getUpcomingEvents(),
    shellProps(),
    getFaqItems(),
  ]);
  return { ...shell, slides, zones, featured, events, faq };
}
