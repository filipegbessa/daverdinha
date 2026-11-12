import type { Metadata } from 'next';
import { FullSite } from '@/features/site/components/FullSite';
import { ComingSoon } from '@/features/site/components/ComingSoon';
import { businessInfo, generateLocalBusinessJsonLd } from '@/data/business';
import { JsonLd } from '@/features/site/components/JsonLd';
import { loadFullSite } from '@/features/site/lib/load-full-site';
import { getSiteMode } from '@/lib/site-mode';

const OG_IMAGE = {
  url: '/logo-circle.png',
  width: 1200,
  height: 1200,
  alt: 'Daverdinha — Ateliê de Plantas',
};

export function generateMetadata(): Metadata {
  const soon = getSiteMode() === 'soon';

  const title = soon ? 'Daverdinha · Em breve' : 'Daverdinha · Ateliê de plantas no Rio de Janeiro';
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
      url: process.env.SITE_URL,
      images: [OG_IMAGE],
    },
  };
}

export default async function Page() {
  const mode = getSiteMode();

  // A API só é consultada no modo 'full'. Uma página que só diz "em breve" não
  // tem por que cair junto com o backend do bot.
  const data = mode === 'full' ? await loadFullSite() : null;
  const zones = data?.zones ?? [];

  return (
    <>
      {/* Fetched once here and handed to both consumers, so the structured data
          Google reads and the section a visitor reads can never disagree. */}
      <JsonLd data={generateLocalBusinessJsonLd(zones.map((zone) => zone.zone))} />
      {data ? <FullSite {...data} /> : <ComingSoon />}
    </>
  );
}
