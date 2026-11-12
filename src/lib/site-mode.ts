import { getSiteSettings } from '@/lib/site-settings';

/**
 * Qual cara o site público mostra em `/`: o site completo (`full`) ou a
 * página "em breve" (`soon`). Vem do interruptor "Site" do Dashboard (ver
 * `lib/site-settings.ts`).
 *
 * Também decide o que é prévia: fora de `full`, `/produtos` e `/agenda` são
 * noindex e ficam fora do sitemap, e lista vazia da API vira exemplo. Em
 * `full`, exemplo nunca aparece.
 */
export type SiteMode = 'soon' | 'full';

export async function getSiteMode(): Promise<SiteMode> {
  return (await getSiteSettings()).siteEnabled ? 'full' : 'soon';
}
