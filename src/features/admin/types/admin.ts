import type { SiteEvent } from '@/features/site/types/event';

export interface BotSettings {
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
  covered: boolean;
  /** Área de entrega do site; sem área, o site não entrega no bairro. */
  areaId?: string | null;
}

/** Subdivisão de uma zona com valor de entrega próprio (só o site usa). */
export interface DeliveryAreaAdmin {
  id: string;
  zone: string;
  name: string;
  fee: number;
  locations: { id: string; regionName: string; covered: boolean }[];
}

/** `GET /delivery-areas`: por zona, as áreas e os bairros atendidos sem área. */
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
  price: number;
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
  deliveryFee: number;
  total: number;
  /** Só em pedido de ingresso. */
  event: { id: string; title: string; slug: string; startsAt: string } | null;
  /** Um por participante; `[]` em pedido de produto. */
  tickets: { id: string; attendeeName: string; unitPrice: number; checkedInAt: string | null }[];
  payment: { linkId: string | null; orderId: string | null; chargeId: string | null; status: string | null };
  paymentUrl: string | null;
  paidAt: string | null;
  expiresAt: string;
  createdAt: string;
}
