import type { Metadata } from 'next';
import { FullSite } from '@/features/site/components/FullSite';
import { JsonLd } from '@/features/site/components/JsonLd';
import { businessInfo, generateLocalBusinessJsonLd } from '@/data/business';
import { loadFullSite } from '@/features/site/lib/load-full-site';

const OG_IMAGE = {
  url: '/logo-circle.png',
  width: 1200,
  height: 1200,
  alt: 'Daverdinha — Ateliê de Plantas',
};

/**
 * Pré-visualização do site institucional completo pra cliente validar
 * enquanto `/` continua em "em breve" (ver `src/lib/site-mode.ts`). Fica fora
 * do sitemap e sinaliza noindex na própria página. Não é secreto, só não é
 * pra aparecer no Google antes do lançamento. Sem Disallow no robots.txt de
 * propósito: com ele o Google não leria este noindex.
 */
export function generateMetadata(): Metadata {
  const title = 'Daverdinha · Ateliê de plantas no Rio de Janeiro';
  const description = businessInfo.description;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
      url: process.env.SITE_URL,
      images: [OG_IMAGE],
    },
  };
}

export default async function SitePreviewPage() {
  const data = await loadFullSite();

  return (
    <>
      <JsonLd data={generateLocalBusinessJsonLd(data.zones.map((zone) => zone.zone))} />
      <FullSite {...data} />
    </>
  );
}
