/**
 * Um slide do topo da home. Contrato previsto pra `GET /hero-slides/active`,
 * que ainda não existe na API: até lá a home mostra só o slide padrão
 * (`DEFAULT_HERO_SLIDE`) e não vira slideshow.
 */
export interface HeroSlide {
  id: string;
  /** Linha pequena acima do título, ex.: "Santo Cristo · Rio de Janeiro". */
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string | null;
  /** Botão principal. Sem `linkUrl`, leva pro catálogo. */
  linkLabel: string | null;
  linkUrl: string | null;
}
