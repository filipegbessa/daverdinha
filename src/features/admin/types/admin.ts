export interface BotSettings {
  botEnabled: boolean;
  welcomeMessage: string;
  invalidAttemptsExceededMessage: string;
  mediaReceivedMessage: string;
  orderReceivedMessage: string;
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
}

export type ConversationStatus = 'bot_active' | 'paused_human';
export type EntryPoint = 'menu' | 'catalog';

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
export type MessageKind = 'text' | 'invalid_content' | 'order';

export interface OrderItem {
  id: string;
  productRetailerId: string;
  productName: string | null;
  quantity: number;
  unitPrice: string | null;
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
