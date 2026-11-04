/**
 * Contrato público da agenda, igual ao que a API devolve em
 * `GET /events/upcoming` e `GET /events/:slug` (ver
 * `docs/plans/2026-11-04-agenda-eventos.md` no daverdinha-api).
 */
export interface SiteEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** ISO 8601. */
  startsAt: string;
  /** ISO 8601. Depois dele o evento sai da faixa e da lista sozinho. */
  endsAt: string;
  /** `null` = no ateliê, com o endereço da loja. */
  locationName: string | null;
  locationAddress: string | null;
  /** `null` = gratuito. */
  price: number | null;
  spots: number | null;
  imageUrl: string | null;
  /** `null` = inscrição pelo WhatsApp, com mensagem pronta montada pelo site. */
  ctaUrl: string | null;
}
