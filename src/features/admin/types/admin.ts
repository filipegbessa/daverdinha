export interface BotSettings {
  botEnabled: boolean;
  welcomeMessage: string;
  deliveryPrompt: string;
  deliveryWaitMessage: string;
}

export type MenuItemType = 'texto' | 'entrega' | 'atendente';

export interface MenuItem {
  id: string;
  ordem: number;
  tema: string;
  tipo: MenuItemType;
  resposta: string | null;
  active: boolean;
}

export interface DeliveryLocation {
  id: string;
  zona: string;
  nomeRegiao: string;
  atendida: boolean;
}

export type ConversationStatus = 'bot_active' | 'paused_human';
export type EntryPoint = 'menu' | 'catalog';

export interface Conversation {
  id: string;
  telefone: string;
  nome: string | null;
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
