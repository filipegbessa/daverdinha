import { Header } from "@/features/site/components/Header";
import { Hero } from "@/features/site/components/Hero";
import { About } from "@/features/site/components/About";
import { ProductsCarouselSpike } from "@/features/site/components/ProductsCarouselSpike";
import { DeliveryZones } from "@/features/site/components/DeliveryZones";
import { Location } from "@/features/site/components/Location";
import { Faq } from "@/features/site/components/Faq";
import { Footer } from "@/features/site/components/Footer";
import type { DeliveryZone } from "@/features/site/lib/delivery-zones";

/**
 * As seções institucionais completas, sem a flag de `/` em volta — usado
 * tanto por `/` (quando SITE_MODE=full) quanto por `/site` (que mostra a
 * versão completa pra cliente validar mesmo com `/` em "em breve").
 */
export function FullSite({ zones }: { zones: DeliveryZone[] }) {
  return (
    <>
      <Header />
      <Hero />
      <About />
      {/* SPIKE: troca pro <Products /> real assim que o desenho do catálogo fechar */}
      <ProductsCarouselSpike />
      <DeliveryZones zones={zones} />
      <Location />
      <Faq />
      <Footer />
    </>
  );
}
