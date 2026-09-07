export interface BotSettings {
  botEnabled: boolean;
  welcomeMessage: string;
  menuPrompt: string;
  deliveryPrompt: string;
  deliveryWaitMessage: string;
  deliveryNotCoveredMessage: string;
  deliveryUnrecognizedMessage: string;
  invalidAttemptsExceededMessage: string;
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
  reply: string | null;
  question: string | null;
  noMatchReply: string | null;
  answerOptions: MenuItemAnswerOption[];
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
  updatedAt: string;
}

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  direction: MessageDirection;
  body: string;
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
