import { businessInfo } from '@/data/business';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { HERO_MESSAGE } from '@/features/site/lib/whatsapp-messages';
import type { HeroSlide } from '@/features/site/types/hero-slide';

/**
 * O slide que a home mostra quando não há nenhum no ar (nada cadastrado em
 * "Destaques" ou a API fora). O título é o H1 da home: diz o que a Daverdinha
 * é e onde fica, que é o que o Google mais pesa. Com slides cadastrados, o H1
 * da home passa a ser o título do primeiro da lista — vale a cliente manter
 * um assim na frente.
 */
export const DEFAULT_HERO_SLIDE: HeroSlide = {
  id: 'default',
  eyebrow: `${businessInfo.address.neighborhood} · ${businessInfo.address.city}`,
  title: 'Ateliê de plantas, vasos e oficinas no Rio de Janeiro',
  description: 'Mudas, vasos e arranjos feitos no ateliê, com entrega em bairros do Rio. Pedido direto pelo WhatsApp.',
  imageUrl: null,
  linkLabel: 'Ver produtos',
  linkUrl: PRODUCTS_HREF,
  whatsappLabel: null,
  whatsappMessage: HERO_MESSAGE,
};
