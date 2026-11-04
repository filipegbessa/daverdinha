import type { Metadata } from "next";
import { FullSite } from "@/features/site/components/FullSite";
import { businessInfo, generateLocalBusinessJsonLd } from "@/data/business";
import { getCoveredDeliveryZones } from "@/features/site/lib/delivery-zones";

const OG_IMAGE = {
  url: "/logo.png",
  width: 1200,
  height: 1200,
  alt: "Daverdinha — Ateliê de Plantas",
};

/**
 * Pré-visualização do site institucional completo pra cliente validar
 * enquanto `/` continua em "em breve" (ver `src/lib/site-mode.ts`). Fica fora
 * do sitemap e sinaliza noindex tanto aqui quanto em `robots.ts` — não é
 * secreto, só não é pra aparecer no Google antes do lançamento.
 */
export function generateMetadata(): Metadata {
  const title = "Daverdinha — Ateliê de plantas no Rio de Janeiro";
  const description = businessInfo.description;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: process.env.SITE_URL,
      images: [OG_IMAGE],
    },
  };
}

export default async function SitePreviewPage() {
  const zones = await getCoveredDeliveryZones();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateLocalBusinessJsonLd(zones.map((zone) => zone.zone)),
          ),
        }}
      />
      <FullSite zones={zones} />
    </>
  );
}
