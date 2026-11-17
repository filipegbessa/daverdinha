import type { SiteEvent } from '@/features/site/types/event';

export interface BotSettings {
  /**
   * O módulo de WhatsApp no admin. Desligado, o menu esconde o grupo Bot, o
   * bot fica desligado e não sai push de mensagem nova.
   */
  whatsappModuleEnabled: boolean;
  botEnabled: boolean;
  welcomeMessage: string;
  invalidAttemptsExceededMessage: string;
  mediaReceivedMessage: string;
  orderReceivedMessage: string;
  /** Bytes de mídia em uso no R2. A API já converte de bigint para number. */
  mediaBytesUsed: number;
}

/**
 * An option in the WhatsApp menu. Exactly one item has `isSystem` — the
 * delivery-location flow, which answers from its own `delivery*` messages
 * rather than the plain `reply` every other item uses, and which can be
 * edited but never created or deleted.
 */
export interface MenuItem {
  id: string;
  order: number;
  topic: string;
  isSystem: boolean;
  reply: string | null;
  deliveryPrompt: string | null;
  deliveryConfirmedMessage: string | null;
  deliveryNotCoveredMessage: string | null;
  deliveryUnrecognizedMessage: string | null;
  active: boolean;
}

export interface DeliveryLocation {
  id: string;
  zone: string;
  regionName: string;
  /** Área de entrega; sem área, o bairro não é atendido (nem pelo site, nem pelo bot). */
  areaId?: string | null;
}

/** Subdivisão de uma zona com valor de entrega próprio; os bairros dela são os atendidos. */
export interface DeliveryAreaAdmin {
  id: string;
  zone: string;
  name: string;
  fee: number;
  locations: { id: string; regionName: string }[];
}

/** `GET /delivery-areas`: por zona, as áreas e os bairros fora de qualquer área (não atendidos). */
export interface DeliveryZoneAreas {
  zone: string;
  areas: DeliveryAreaAdmin[];
  unassigned: { id: string; regionName: string }[];
}

/** Configurações da loja (`/admin/loja`): retirada e parcelamento. */
export interface StoreSettings {
  /** Site completo em `/`; desligado, `/` é a página "em breve". */
  siteEnabled: boolean;
  /** Venda pelo site (carrinho + Pagar.me); desligada, a compra é pelo WhatsApp. */
  storeEnabled: boolean;
  /** Venda e inscrição de eventos pelo site, junto com o "Vender ingressos pelo site" de cada evento. */
  ticketsEnabled: boolean;
  /** A chave do Pagar.me está configurada na API? Sem ela a loja aparece, mas o pagamento não inicia. */
  paymentConfigured: boolean;
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupHours: string;
  pickupInstructions: string | null;
  maxInstallments: number;
  minInstallmentValue: number;
  /** Pronta entrega com este estoque ou menos entra no aviso do Dashboard. */
  lowStockThreshold: number;
  /** O interruptor da pausa e o texto dela, como estão salvos. */
  storePaused: boolean;
  pauseMessage: string | null;
  /** ISO; a loja reabre sozinha nesse momento. */
  pausedUntil: string | null;
  /** A pausa valendo agora (`null` com o interruptor desligado ou depois da data de volta). */
  activePause: { message: string | null; until: string | null } | null;
}

/** `GET /site-orders/summary`: o topo do Dashboard. */
export interface SalesSummary {
  today: { orders: number; revenue: number };
  last7Days: { orders: number; revenue: number };
  last30Days: { orders: number; revenue: number };
  averageTicket30Days: number | null;
  toPrepare: number;
  readyToDeliver: number;
  topProducts: { name: string; quantity: number }[];
  lowStock: { threshold: number; products: { id: string; name: string; stock: number }[] };
}

/**
 * Categoria do catálogo do site ("Categorias" no admin) — não confundir com
 * `Category`, que é o "marcador" de conversa na tela. `slug` é gerado pela
 * API na criação e nunca muda (é a URL `/produtos/[slug]`). Lista sem
 * paginação: são poucas.
 */
export interface ProductCategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  order: number;
  _count: { products: number };
}

export interface ProductAdmin {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** O preço que vale agora (o promocional, com promoção valendo). */
  price: number;
  /** O preço cheio, só com promoção valendo agora. */
  listPrice?: number | null;
  /** O preço cheio cadastrado, com ou sem promoção. É ele que o formulário edita. */
  regularPrice?: number;
  /** A promoção como está salva (valendo agora ou não). Datas em ISO. */
  promoPrice?: number | null;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  /** URLs públicas do Vercel Blob; a primeira é a capa. */
  images: string[];
  categoryId: string;
  category: { id: string; name: string; slug: string };
  active: boolean;
  /** Aparece na vitrine da home. */
  featured: boolean;
  order: number;
  /** Com número: pronta entrega (0 = esgotado). `null`: sob encomenda. */
  stock: number | null;
  /** Prazo de confecção salvo, em dias — guardado mesmo em pronta entrega. */
  leadTimeDays: number | null;
  /** O que o site mostra, já descontando unidades reservadas em pedidos pendentes. */
  availability: 'in_stock' | 'made_to_order' | 'sold_out';
}

export type ConversationStatus = 'bot_active' | 'paused_human';
export type EntryPoint = 'menu' | 'catalog';

/**
 * Marcador de conversa ("Marcadores" no admin, `/admin/marcadores`). O nome
 * no código segue o recurso da API (`/categories`).
 */
export interface Category {
  id: string;
  name: string;
  /** Free-form hex (#rrggbb) chosen by the operator from a colour input. */
  color: string;
  conversationCount?: number;
}

export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: ConversationStatus;
  entryPoint: EntryPoint | null;
  unread: boolean;
  updatedAt: string;
  categories: Category[];
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageKind = 'text' | 'invalid_content' | 'order' | 'image' | 'audio';

export interface OrderItem {
  id: string;
  productRetailerId: string;
  productName: string | null;
  quantity: number;
  unitPrice: number | null;
  currency: string | null;
}

export interface Order {
  id: string;
  catalogId: string;
  items: OrderItem[];
}

export interface Message {
  id: string;
  direction: MessageDirection;
  kind?: MessageKind;
  body: string | null;
  order?: Order | null;
  createdAt: string;
  whatsappMessageId?: string | null;
  repliedToWamid?: string | null;
  repliedTo?: Pick<Message, 'id' | 'kind' | 'body' | 'direction'> | null;
}

export interface ConversationWithMessages extends Conversation {
  /** The tail of the transcript; older messages are fetched as the operator scrolls up. */
  messages: Message[];
  hasMoreMessages: boolean;
}

/** The envelope every paginated admin listing returns. */
export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ConversationList extends Paginated<Conversation> {
  /** Every conversation waiting on a human, regardless of the active filters. */
  unreadTotal: number;
}

export type SiteOrderStatus = 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'refunded';
export type FulfillmentStatus = 'awaiting' | 'preparing' | 'ready' | 'completed';

/**
 * Evento da agenda no admin (`/events`). `ticketSales` aqui é o do próprio
 * evento, sem combinar com o interruptor do Dashboard; `sold` conta os
 * ingressos de pedidos pagos e `reserved` os de pedidos ainda no prazo.
 */
export interface EventAdmin extends SiteEvent {
  published: boolean;
  createdAt: string;
  updatedAt: string;
  sold: number;
  reserved: number;
}

/** Um participante na lista de presença (`/events/:id/attendees`). */
export interface Attendee {
  id: string;
  attendeeName: string;
  checkedInAt: string | null;
  order: { id: string; code: string; customerName: string; customerPhone: string };
}

/** A lista de presença: página de participantes mais a lotação do evento. */
export interface AttendeeList extends Paginated<Attendee> {
  sold: number;
  spots: number | null;
}

/** Pedido feito no site (`/site-orders`). Não confundir com o pedido de catálogo do WhatsApp. */
export interface SiteOrderAdmin {
  id: string;
  code: string;
  kind: 'products' | 'tickets';
  status: SiteOrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  customer: { name: string; email: string; phone: string };
  deliveryMethod: 'pickup' | 'delivery' | null;
  address: {
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    bairro: string | null;
    zone: string | null;
    area: string | null;
  } | null;
  notes: string | null;
  items: {
    productId: string | null;
    name: string;
    slug: string | null;
    unitPrice: number;
    quantity: number;
    imageUrl: string | null;
    leadTimeDays: number | null;
  }[];
  subtotal: number;
  /** Desconto do cupom (0 sem cupom), já tirado do total. */
  discount?: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  /** Só em pedido de ingresso. */
  event: { id: string; title: string; slug: string; startsAt: string } | null;
  /** Um por participante; `[]` em pedido de produto. */
  tickets: { id: string; attendeeName: string; unitPrice: number; checkedInAt: string | null }[];
  payment: { linkId: string | null; orderId: string | null; chargeId: string | null; status: string | null };
  paymentUrl: string | null;
  paidAt: string | null;
  /** Quando saiu o e-mail de confirmação; `null` se ainda não saiu (ou falhou). */
  confirmationSentAt: string | null;
  expiresAt: string;
  createdAt: string;
}

/** `GET /coupons`: "Promoções → Cupons". Datas em ISO; dinheiro em reais. */
export interface CouponAdmin {
  id: string;
  code: string;
  description: string | null;
  type: 'percent' | 'fixed' | 'free_shipping';
  /** Porcentagem (1–100) ou reais; `null` no frete grátis. */
  value: number | null;
  maxDiscount: number | null;
  scope: 'order' | 'categories' | 'products' | 'events';
  minSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  active: boolean;
  categoryIds: string[];
  productIds: string[];
  eventIds: string[];
  /** Pedidos pagos com o cupom. */
  uses: number;
  /** Pedidos pendentes ainda no prazo, segurando um uso. */
  reserved: number;
  createdAt: string;
}
