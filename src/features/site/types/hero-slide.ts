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
}
