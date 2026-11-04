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
import type { Product, ProductCategory } from "@/features/site/types/catalog";
import type { SiteEvent } from "@/features/site/types/event";

export interface FullSiteData {
  home: string;
  zones: DeliveryZone[];
  categories: ProductCategory[];
  products: Product[];
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
export function FullSite({ home, zones, categories, products, events }: FullSiteData) {
  return (
    <SiteShell home={home} events={events} showPreviewNotice={products.some(isSample)}>
      <Hero />
      <ProductsSection categories={categories} products={products} />
      <EventsSection events={events} />
      <About />
      <DeliveryZones zones={zones} />
      <Location />
      <Faq />
    </SiteShell>
  );
}
