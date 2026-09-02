/**
 * Informações do negócio
 *
 * Fonte única dos dados reais da Daverdinha — nome, contato, endereço.
 * Editar aqui atualiza em todo o site (SEO, seção de localização, avaliações).
 *
 * Não confundir com variáveis de ambiente (.env), que são pra configuração
 * técnica (chaves de API, URLs de serviço). Isso aqui é conteúdo do negócio,
 * hoje hardcoded, pensado pra um dia virar editável pelo admin.
 */
import { DELIVERY_ZONES } from '@/features/site/lib/delivery-zones';

export const businessInfo = {
  name: 'Daverdinha',
  description:
    'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',

  contact: {
    phone: {
      number: '5521986509259',
    },
    instagram: {
      url: 'https://www.instagram.com/daverdinha_/',
      handle: '@daverdinha_',
    },
  },

  address: {
    street: 'R. Capiberibe, 32',
    neighborhood: 'Santo Cristo',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20220-030',
    formatted: 'R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030',
  },

  legal: {
    cnpj: '66.371.530/0001-54',
    razaoSocial: '66.371.530 Alana Viana Moreno',
  },

  areaServed: DELIVERY_ZONES.map((z) => z.zona),
} as const;

export function generateLocalBusinessJsonLd(): Record<string, unknown> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessInfo.name,
    description: businessInfo.description,
    ...(siteUrl ? { url: siteUrl } : {}),
    sameAs: [businessInfo.contact.instagram.url],
    areaServed: businessInfo.areaServed,
    telephone: businessInfo.contact.phone.number,
    address: businessInfo.address.formatted,
    taxID: businessInfo.legal.cnpj,
  };
}
