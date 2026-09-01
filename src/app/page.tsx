import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { Products } from '@/features/site/components/Products';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Location } from '@/features/site/components/Location';
import { Faq } from '@/features/site/components/Faq';
import { Footer } from '@/features/site/components/Footer';
import { generateLocalBusinessJsonLd } from '@/data/business';

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessJsonLd()) }}
      />
      <Header />
      <Hero />
      <About />
      <Products />
      <DeliveryZones />
      <Location />
      <Faq />
      <Footer />
    </>
  );
}
