/**
 * Um slide do topo da home, de `GET /hero-slides/active` (cadastro em
 * "Destaques" no admin). Igual ao `HeroSlide` de
 * `daverdinha-api/src/hero-slides/hero-slides.service.ts`.
 */
export interface HeroSlide {
  id: string;
  /** Linha pequena acima do título, ex.: "Santo Cristo · Rio de Janeiro". */
  eyebrow: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  /** Botão principal: vem com os dois ou com nenhum (sem botão). */
  linkLabel: string | null;
  /** Caminho do site (`/produtos/vasos`) ou endereço externo (`https://...`). */
  linkUrl: string | null;
  /** Texto do botão do WhatsApp; sem ele, "Falar no WhatsApp". */
  whatsappLabel: string | null;
  /** A mensagem que já vai escrita na conversa. Sem ela, não há botão do WhatsApp. */
  whatsappMessage: string | null;
}
