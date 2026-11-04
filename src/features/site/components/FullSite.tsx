import { Header } from "@/features/site/components/Header";
import { Hero } from "@/features/site/components/Hero";
import { About } from "@/features/site/components/About";
import { Products } from "@/features/site/components/Products";
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
      <Products />
      <DeliveryZones zones={zones} />
      <Location />
      <Faq />
      <Footer />
    </>
  );
}
