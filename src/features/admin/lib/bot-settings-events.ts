/**
 * O Dashboard liga e desliga o módulo de WhatsApp, e o menu lateral (no
 * layout) precisa esconder ou mostrar o grupo Bot na hora, sem recarregar a
 * página. Os dois leem `/bot-settings` cada um com o seu `useApiResource`;
 * este evento avisa o layout pra ler de novo.
 */
export const BOT_SETTINGS_CHANGED = 'daverdinha:bot-settings-changed';

export function notifyBotSettingsChanged(): void {
  window.dispatchEvent(new Event(BOT_SETTINGS_CHANGED));
}

/**
 * Sem o campo (API antiga, durante o deploy), o módulo conta como ligado:
 * esconder o bot por engano seria pior que mostrá-lo.
 */
export function isWhatsappModuleOn(settings: { whatsappModuleEnabled?: boolean } | null | undefined): boolean {
  return settings?.whatsappModuleEnabled !== false;
}
