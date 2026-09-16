import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { Products } from '@/features/site/components/Products';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Location } from '@/features/site/components/Location';
import { Faq } from '@/features/site/components/Faq';
import { Footer } from '@/features/site/components/Footer';
import { generateLocalBusinessJsonLd } from '@/data/business';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';

export default async function Page() {
  // Fetched once here and handed to both consumers, so the structured data
  // Google reads and the section a visitor reads can never disagree.
  const zones = await getCoveredDeliveryZones();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessJsonLd(zones.map((zone) => zone.zone))),
        }}
      />
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
