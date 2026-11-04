import { businessInfo } from '@/data/business';
import type { Product } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import { absoluteUrl, eventHref, productHref } from '@/features/site/lib/paths';

/**
 * Dados estruturados (schema.org) das páginas do catálogo e da agenda. É o
 * que deixa o Google mostrar preço, data e local direto no resultado da busca.
 */

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function productJsonLd(product: Product): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: product.category.name,
    ...(product.images.length > 0 ? { image: product.images } : {}),
    brand: { '@type': 'Brand', name: businessInfo.name },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(productHref(product)),
      price: product.price.toFixed(2),
      priceCurrency: 'BRL',
      // A API só devolve produto ativo: se está na página, está à venda.
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: businessInfo.name },
    },
  };
}

export function eventJsonLd(event: SiteEvent): Record<string, unknown> {
  const atAtelier = event.locationName === null;
  const { address } = businessInfo;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.imageUrl ? { image: [event.imageUrl] } : {}),
    location: atAtelier
      ? {
          '@type': 'Place',
          name: `${businessInfo.name} — ateliê`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: address.street,
            addressLocality: address.city,
            addressRegion: address.state,
            postalCode: address.zipCode,
            addressCountry: 'BR',
          },
        }
      : { '@type': 'Place', name: event.locationName, address: event.locationAddress ?? event.locationName },
    organizer: { '@type': 'Organization', name: businessInfo.name, url: absoluteUrl('/') },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(eventHref(event)),
      price: (event.price ?? 0).toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  };
}

/**
 * Serializa pra dentro de um `<script>`. O `<` escapado impede que um texto
 * vindo do admin (descrição de produto, título de evento) com `</script>`
 * feche a tag e vire HTML na página.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
