import type { StorePause } from '@/lib/site-settings';

const RETURN_DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' });

const DEFAULT_MESSAGE = 'A loja está em pausa e não está recebendo pedidos agora.';

/** "Voltamos a receber pedidos em 6 de janeiro." ou `null`, sem data de volta. */
export function pauseReturnText(pause: StorePause): string | null {
  return pause.until ? `Voltamos a receber pedidos em ${RETURN_DATE.format(new Date(pause.until))}.` : null;
}

/** O aviso inteiro: a mensagem da cliente (ou a padrão) e a data de volta. */
export function pauseText(pause: StorePause): string {
  const message = pause.message?.trim() || DEFAULT_MESSAGE;
  const back = pauseReturnText(pause);
  return back ? `${message} ${back}` : message;
}
