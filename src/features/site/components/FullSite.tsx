import { Hero } from '@/features/site/components/Hero';
import type { StorePause } from '@/lib/site-settings';
import { About } from '@/features/site/components/About';
import { ProductsSection } from '@/features/site/components/ProductsSection';
import { EventsSection } from '@/features/site/components/EventsSection';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Location } from '@/features/site/components/Location';
import { Faq } from '@/features/site/components/Faq';
import { SiteShell } from '@/features/site/components/SiteShell';
import type { DeliveryZone } from '@/features/site/lib/delivery-zones';
import type { Product } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import type { HeroSlide } from '@/features/site/types/hero-slide';
import type { AboutContent } from '@/features/site/types/about';
import type { FaqItem } from '@/data/faq';

export interface FullSiteData {
  home: string;
  slides: HeroSlide[];
  zones: DeliveryZone[];
  /** Só os produtos em destaque: a home é vitrine, o catálogo inteiro fica em `/produtos`. */
  featured: Product[];
  events: SiteEvent[];
  /** Interruptor "Loja" do Dashboard. */
  storeEnabled: boolean;
  /** Loja em pausa: aviso no topo. */
  storePause?: StorePause | null;
  /** Perguntas frequentes com os dados do admin; sem elas, as respostas padrão. */
  faq?: FaqItem[];
  /** O "Sobre" do admin; sem ele, o texto do código. */
  about?: AboutContent | null;
}

/**
 * A home do site completo, sem a flag de `/` em volta — usada tanto por `/`
 * (com o site ligado no Dashboard) quanto por `/site` (que mostra a versão completa
 * pra cliente validar mesmo com `/` em "em breve"). Recebe os dados prontos:
 * quem busca é a página.
 *
 * Fundo alternado claro/areia, uma seção por vez — antes duas seções
 * seguidas dividiam o mesmo fundo e a página parecia ter menos partes do que
 * tinha.
 */
export function FullSite({
  home,
  storeEnabled,
  storePause,
  slides,
  zones,
  featured,
  events,
  faq,
  about,
}: FullSiteData) {
  return (
    <SiteShell home={home} storeEnabled={storeEnabled} storePause={storePause}>
      <Hero slides={slides} />
      <ProductsSection products={featured} />
      <EventsSection events={events} cardVariant="compact" />
      <About content={about} />
      <DeliveryZones zones={zones} />
      <Location />
      <Faq items={faq} />
    </SiteShell>
  );
}
