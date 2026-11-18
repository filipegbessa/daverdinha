/**
 * A seção "Sobre" da home, de `GET /site-content/about` (cadastro em "Sobre"
 * no admin). Igual ao `AboutContent` de
 * `daverdinha-api/src/site-content/site-content.service.ts`.
 */
export interface AboutContent {
  /** `false` = nunca salvo no admin: o site usa o texto do código. */
  configured: boolean;
  title: string | null;
  /** Parágrafos separados por linha em branco. */
  text: string | null;
  imageUrl: string | null;
  /** Texto do link pro Instagram; `null` = sem o link. */
  instagramLabel: string | null;
  updatedAt: string | null;
}
