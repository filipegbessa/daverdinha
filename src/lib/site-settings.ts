import { cache } from 'react';

/**
 * Os dois interruptores do site, ligados e desligados pela cliente no
 * Dashboard do admin (configurações da loja na API, `GET /store-settings/public`):
 *
 * - `siteEnabled`: `/` mostra o site completo; desligado, a página "em breve"
 *   (e o site completo fica só na prévia `/site`).
 * - `storeEnabled`: venda pelo site, com carrinho e Pagar.me; desligada, a
 *   compra é pelo WhatsApp e as rotas da loja respondem 404.
 *
 * Substituem as antigas variáveis `SITE_MODE` e `NEXT_PUBLIC_STORE_ENABLED`:
 * não precisa de redeploy, a mudança aparece em até um minuto (o cache da
 * leitura).
 *
 * Server-only. Os componentes de cliente recebem o valor da loja pelo
 * `StoreEnabledProvider` que o `SiteShell` monta.
 *
 * API fora do ar, sem URL ou resposta estranha: os dois desligados. A falha
 * segura é esconder o site inacabado e não vender sem conseguir confirmar o
 * pagamento.
 */
export interface SiteSettings {
  siteEnabled: boolean;
  storeEnabled: boolean;
}

export const SITE_SETTINGS_REVALIDATE_SECONDS = 60;

const OFF: SiteSettings = { siteEnabled: false, storeEnabled: false };

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return OFF;
  try {
    const response = await fetch(`${apiUrl}/store-settings/public`, {
      next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS },
    });
    if (!response.ok) return OFF;
    const body = (await response.json()) as Partial<Record<keyof SiteSettings, unknown>>;
    return {
      siteEnabled: body.siteEnabled === true,
      storeEnabled: body.storeEnabled === true,
    };
  } catch {
    return OFF;
  }
});
