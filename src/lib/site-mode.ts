/**
 * Qual cara o site público mostra em `/`.
 *
 * O site institucional completo continua inteiro no repositório — todas as
 * seções, todos os testes — mas boa parte do conteúdo ainda é placeholder
 * (`PRODUCT_CATEGORIES` está vazio esperando a cliente responder), então ele
 * fica atrás desta flag até o texto real existir. Enquanto isso `/` mostra uma
 * landing "em construção" com os canais de contato que já são reais.
 *
 * Server-only de propósito (sem `NEXT_PUBLIC_`): todo leitor desta função é um
 * Server Component, então não há motivo pra embutir a flag no bundle.
 *
 * Ausente, vazia ou escrita errada cai em 'soon': a falha segura é esconder um
 * site inacabado, não publicá-lo. Só a string exata 'full' libera o site
 * completo.
 *
 * ⚠️ `/` é estática, então mudar esta variável na Vercel só vale a partir do
 * próximo build — é "Redeploy", não um toggle em tempo real.
 */
export type SiteMode = 'soon' | 'full';

export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === 'full' ? 'full' : 'soon';
}
