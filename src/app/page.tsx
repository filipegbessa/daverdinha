import type { Metadata } from 'next';
import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { Products } from '@/features/site/components/Products';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Location } from '@/features/site/components/Location';
import { Faq } from '@/features/site/components/Faq';
import { Footer } from '@/features/site/components/Footer';
import { ComingSoon } from '@/features/site/components/ComingSoon';
import { businessInfo, generateLocalBusinessJsonLd } from '@/data/business';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { getSiteMode } from '@/lib/site-mode';

const OG_IMAGE = {
  url: '/logo.jpeg',
  width: 1280,
  height: 1280,
  alt: 'Daverdinha — Ateliê de Plantas',
};

export function generateMetadata(): Metadata {
  const soon = getSiteMode() === 'soon';

  const title = soon ? 'Daverdinha — Em breve' : 'Daverdinha — Ateliê de plantas no Rio de Janeiro';
  const description = soon
    ? 'Nosso site está em construção. Enquanto isso, fale com a gente pelo WhatsApp ou pelo Instagram.'
    : businessInfo.description;

  return {
    title,
    description,
    // `metadata` faz merge raso entre segmentos: definir `openGraph` aqui
    // substitui o objeto inteiro que `layout.tsx` define, campo a campo não
    // existe. Por isso tudo é repetido, não só `images`.
    openGraph: {
      title,
      description,
      type: 'website',
      url: process.env.NEXT_PUBLIC_SITE_URL,
      images: [OG_IMAGE],
    },
  };
}

export default async function Page() {
  const mode = getSiteMode();

  // A API só é consultada no modo 'full'. Uma página que só diz "em breve" não
  // tem por que cair junto com o backend do bot.
  const zones = mode === 'full' ? await getCoveredDeliveryZones() : [];

  return (
    <>
      {/* Fetched once here and handed to both consumers, so the structured data
          Google reads and the section a visitor reads can never disagree. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessJsonLd(zones.map((zone) => zone.zone))),
        }}
      />
      {mode === 'soon' ? (
        <ComingSoon />
      ) : (
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
      )}
    </>
  );
}
