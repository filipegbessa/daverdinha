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
export const businessInfo = {
  name: 'Daverdinha',
  description:
    'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',

  contact: {
    phone: {
      number: '5521986509259',
      display: '(21) 98650-9259',
    },
    instagram: {
      url: 'https://www.instagram.com/daverdinha_/',
      handle: '@daverdinha_',
    },
    email: 'contato@daverdinha.com.br',
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

  /**
   * Vazio até a cliente confirmar. Com a lista vazia, o horário some do site
   * e dos dados estruturados — inventar um horário é pior do que não ter,
   * porque o Google mostra e o cliente aparece com a loja fechada. Precisa
   * bater com o perfil da empresa no Google Maps.
   */
  hours: [] as OpeningHours[],
} as const;

export interface OpeningHours {
  /** Como aparece no site: "Ter a sex". */
  label: string;
  /** Dias no formato do schema.org: 'Tuesday', 'Wednesday'… */
  days: string[];
  /** "10:00" */
  opens: string;
  /** "18:00" */
  closes: string;
}

/**
 * `areaServed` is passed in rather than read off `businessInfo`: the served
 * area lives in the database and changes whenever the owner toggles a bairro,
 * while everything else here is a fixed fact about the business.
 */
export function generateLocalBusinessJsonLd(areaServed: string[] = []): Record<string, unknown> {
  const siteUrl = process.env.SITE_URL;

  const { address } = businessInfo;

  return {
    '@context': 'https://schema.org',
    // Subtipo de LocalBusiness pra loja de jardinagem: diz ao Google o ramo,
    // não só que é "um negócio local".
    '@type': 'GardenStore',
    name: businessInfo.name,
    legalName: businessInfo.legal.razaoSocial,
    description: businessInfo.description,
    ...(siteUrl ? { url: siteUrl, image: `${siteUrl}/logo.png` } : {}),
    sameAs: [businessInfo.contact.instagram.url],
    areaServed,
    telephone: `+${businessInfo.contact.phone.number}`,
    email: businessInfo.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.zipCode,
      addressCountry: 'BR',
    },
    ...(businessInfo.hours.length > 0
      ? {
          openingHoursSpecification: businessInfo.hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    taxID: businessInfo.legal.cnpj,
  };
}
