import type { HeroSlide } from '@/features/site/types/hero-slide';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';

/**
 * Os destaques de exemplo do topo da home, pra cliente ver o slideshow na
 * prévia (`/site`) enquanto o cadastro de destaques no admin não existe
 * (pacote 5.3 em `daverdinha-api/docs/estado-da-loja.md`). Só aparecem antes
 * do lançamento e só quando a API não devolve slide (`getHeroSlides`); a
 * página mostra então o aviso de prévia.
 *
 * Os produtos, eventos, o carrinho e o pedido de exemplo saíram em
 * 2026-11-18: o site mostra só o que está cadastrado.
 *
 * Os ids começam com `sample-`: é por eles que a página sabe que está
 * mostrando exemplo.
 */
const SAMPLE_PREFIX = 'sample-';

export function isSample(item: { id: string }): boolean {
  return item.id.startsWith(SAMPLE_PREFIX);
}

/**
 * O primeiro é o slide padrão de verdade (o que a home mostra sem API); os
 * outros dois existem só pra cliente ver o slideshow funcionando.
 */
export const SAMPLE_HERO_SLIDES: HeroSlide[] = [
  DEFAULT_HERO_SLIDE,
  {
    id: 'sample-h2',
    eyebrow: 'Oficina no ateliê',
    title: 'Monte seu terrário com a gente',
    description: 'Duas horas, todo o material incluso, e o terrário vai pra casa com você.',
    imageUrl: null,
    linkLabel: 'Ver agenda',
    linkUrl: '/agenda',
  },
  {
    id: 'sample-h3',
    eyebrow: 'Presentes',
    title: 'Kits prontos pra presentear',
    description: 'Vaso, planta e o passo a passo numa caixa só.',
    imageUrl: null,
    linkLabel: 'Ver kits',
    linkUrl: '/produtos/kits',
  },
];
