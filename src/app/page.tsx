import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Footer } from '@/features/site/components/Footer';
import { generateLocalBusinessJsonLd } from '@/features/site/lib/business-info';

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
      <DeliveryZones />
      <Footer />
    </>
  );
}
