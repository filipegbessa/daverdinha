export interface BotSettings {
  botEnabled: boolean;
  welcomeMessage: string;
  invalidAttemptsExceededMessage: string;
  mediaReceivedMessage: string;
  orderReceivedMessage: string;
}

export type MenuItemType = 'texto' | 'entrega' | 'atendente' | 'pergunta';

export interface MenuItemAnswerOption {
  id: string;
  keywords: string[];
  reply: string;
}

export interface MenuItem {
  id: string;
  order: number;
  topic: string;
  type: MenuItemType;
  isSystem: boolean;
  reply: string | null;
  question: string | null;
  noMatchReply: string | null;
  answerOptions: MenuItemAnswerOption[];
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

export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: ConversationStatus;
  entryPoint: EntryPoint | null;
  unread: boolean;
  updatedAt: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageKind = 'text' | 'invalid_content' | 'order';

export interface OrderItem {
  id: string;
  catalogId: string;
  productRetailerId: string;
  productName: string | null;
  quantity: number;
  unitPrice: string | null;
  currency: string | null;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  kind?: MessageKind;
  body: string | null;
  orderItems?: OrderItem[];
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export type HeroSlideLinkType = 'whatsapp' | 'url';

export interface HeroSlide {
  id: string;
  titulo: string;
  subtitulo: string;
  detalhes: string;
  linkType: HeroSlideLinkType;
  whatsappMessage: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
}
