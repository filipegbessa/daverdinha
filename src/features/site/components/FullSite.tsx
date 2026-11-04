import { Hero } from "@/features/site/components/Hero";
import { About } from "@/features/site/components/About";
import { ProductsSection } from "@/features/site/components/ProductsSection";
import { EventsSection } from "@/features/site/components/EventsSection";
import { DeliveryZones } from "@/features/site/components/DeliveryZones";
import { Location } from "@/features/site/components/Location";
import { Faq } from "@/features/site/components/Faq";
import { SiteShell } from "@/features/site/components/SiteShell";
import { isSample } from "@/features/site/data/samples";
import type { DeliveryZone } from "@/features/site/lib/delivery-zones";
import type { Product } from "@/features/site/types/catalog";
import type { SiteEvent } from "@/features/site/types/event";
import type { HeroSlide } from "@/features/site/types/hero-slide";

export interface FullSiteData {
  home: string;
  slides: HeroSlide[];
  zones: DeliveryZone[];
  /** Só os produtos em destaque: a home é vitrine, o catálogo inteiro fica em `/produtos`. */
  featured: Product[];
  events: SiteEvent[];
}

/**
 * A home do site completo, sem a flag de `/` em volta — usada tanto por `/`
 * (quando SITE_MODE=full) quanto por `/site` (que mostra a versão completa
 * pra cliente validar mesmo com `/` em "em breve"). Recebe os dados prontos:
 * quem busca é a página.
 *
 * Fundo alternado claro/areia, uma seção por vez — antes duas seções
 * seguidas dividiam o mesmo fundo e a página parecia ter menos partes do que
 * tinha.
 */
export function FullSite({ home, slides, zones, featured, events }: FullSiteData) {
  const preview = featured.some(isSample) || events.some(isSample) || slides.some(isSample);

  return (
    <SiteShell home={home} preview={preview}>
      <Hero slides={slides} />
      <ProductsSection products={featured} />
      <EventsSection events={events} />
      <About />
      <DeliveryZones zones={zones} />
      <Location />
      <Faq />
    </SiteShell>
  );
}
