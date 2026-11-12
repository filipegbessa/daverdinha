import type { SiteSettings } from '../site-settings';

/**
 * Mock automático (ligado em `jest.setup.ts`): os testes não chamam a API pra
 * saber se o site e a loja estão ligados. Padrão: os dois desligados, igual à
 * falha segura do módulo real. Cada teste liga o que precisa com
 * `mockSiteSettings`, e o `afterEach` global volta ao padrão.
 *
 * O estado fica no `globalThis` porque o Jest carrega este arquivo duas vezes:
 * como o mock de `@/lib/site-settings` e como o módulo que o teste importa
 * pra chamar `mockSiteSettings`. Os dois precisam ver o mesmo valor.
 */
const OFF: SiteSettings = { siteEnabled: false, storeEnabled: false };
const store = globalThis as typeof globalThis & { __siteSettingsMock?: SiteSettings };

function current(): SiteSettings {
  return store.__siteSettingsMock ?? OFF;
}

export const SITE_SETTINGS_REVALIDATE_SECONDS = 60;

export const getSiteSettings = jest.fn(async (): Promise<SiteSettings> => ({ ...current() }));

export function mockSiteSettings(settings: Partial<SiteSettings>): void {
  store.__siteSettingsMock = { ...current(), ...settings };
}

export function resetSiteSettings(): void {
  store.__siteSettingsMock = { ...OFF };
}
