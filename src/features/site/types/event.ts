/**
 * Contrato público da agenda, igual ao que a API devolve em
 * `GET /events/upcoming` e `GET /events/:slug` (ver o README do
 * daverdinha-api, "Agenda de eventos").
 */
export interface SiteEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** ISO 8601. */
  startsAt: string;
  /** ISO 8601. Depois dele o evento sai da faixa e da lista sozinho. */
  endsAt: string | null;
  /** `null` = no ateliê, com o endereço da loja. */
  locationName: string | null;
  locationAddress: string | null;
  /** `null` = gratuito. */
  price: number | null;
  spots: number | null;
  imageUrl: string | null;
  /**
   * Venda ou inscrição pelo site. A API já combina o "Vender ingressos pelo
   * site" do evento com o interruptor "Venda de ingressos" do Dashboard: o
   * site só olha este campo. Desligado, a inscrição é pelo WhatsApp, com
   * mensagem pronta montada pelo site.
   */
  ticketSales: boolean;
  /** Limite de ingressos por compra, configurado no evento. */
  maxTicketsPerOrder: number;
  /** Vagas que ainda dá pra comprar. `null` = sem limite ou sem venda pelo site. */
  spotsLeft: number | null;
  /** `ticketSales` com `spotsLeft` zerado. */
  soldOut: boolean;
}
