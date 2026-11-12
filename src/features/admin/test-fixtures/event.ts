import type { EventAdmin } from '@/features/admin/types/admin';

/** Evento publicado e à venda pelo site, pros testes da agenda. */
export const oficina: EventAdmin = {
  id: 'e1',
  title: 'Oficina de terrário',
  slug: 'oficina-de-terrario',
  description: 'Monte o seu.',
  startsAt: '2026-11-21T13:00:00.000Z',
  endsAt: '2026-11-21T15:00:00.000Z',
  locationName: null,
  locationAddress: null,
  price: 120,
  spots: 8,
  imageUrl: 'https://blob/events/1.webp',
  ctaUrl: null,
  ticketSales: true,
  maxTicketsPerOrder: 4,
  spotsLeft: 5,
  soldOut: false,
  published: true,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  sold: 3,
  reserved: 0,
};
