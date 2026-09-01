import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Footer } from '@/features/site/components/Footer';

export default function Page() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <DeliveryZones />
      <Footer />
    </>
  );
}
