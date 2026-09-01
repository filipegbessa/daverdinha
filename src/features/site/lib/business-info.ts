import { DELIVERY_ZONES } from './delivery-zones';

export const BUSINESS_INFO = {
  name: 'Da Verdinha',
  description:
    'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',
  instagramUrl: 'https://www.instagram.com/daverdinha_/',
  areaServed: DELIVERY_ZONES.map((z) => z.zona),
  get phone() {
    return process.env.NEXT_PUBLIC_BUSINESS_PHONE;
  },
  get address() {
    return process.env.NEXT_PUBLIC_BUSINESS_ADDRESS;
  },
};

export function generateLocalBusinessJsonLd(): Record<string, unknown> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    ...(siteUrl ? { url: siteUrl } : {}),
    sameAs: [BUSINESS_INFO.instagramUrl],
    areaServed: BUSINESS_INFO.areaServed,
    ...(BUSINESS_INFO.phone ? { telephone: BUSINESS_INFO.phone } : {}),
    ...(BUSINESS_INFO.address ? { address: BUSINESS_INFO.address } : {}),
  };
}
