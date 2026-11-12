import { ApiError } from '@/features/admin/lib/api-error';
import { formatClock } from '@/lib/format';
import type { Attendee } from '@/features/admin/types/admin';

/** O resultado de uma leitura, já no que a tela mostra (cor e texto). */
export type CheckInResult =
  | { tone: 'ok'; message: string; attendee: Attendee }
  | { tone: 'warning'; message: string }
  | { tone: 'error'; message: string };

type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;

/** O que veio do QR ou do teclado, sem espaço nem hífen e em maiúsculas. */
export function normalizeTicketCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Faz o check-in pelo código do ingresso e traduz a resposta da API
 * (`POST /site-order-tickets/check-in-by-code`) pro aviso grande do leitor.
 */
export async function checkInByCode(apiFetch: ApiFetch, eventId: string, rawCode: string): Promise<CheckInResult> {
  const code = normalizeTicketCode(rawCode);
  if (!code) return { tone: 'error', message: 'Digite o código do ingresso.' };
  try {
    const attendee = await apiFetch<Attendee>('/site-order-tickets/check-in-by-code', {
      method: 'POST',
      body: JSON.stringify({ eventId, code }),
    });
    return { tone: 'ok', message: `${attendee.attendeeName} entrou`, attendee };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) return { tone: 'error', message: 'Código não encontrado' };
      if (err.status === 409) {
        switch (err.body.reason) {
          case 'already_checked_in':
            return {
              tone: 'warning',
              message:
                typeof err.body.checkedInAt === 'string'
                  ? `Já entrou às ${formatClock(err.body.checkedInAt)}`
                  : 'Já entrou',
            };
          case 'other_event':
            return { tone: 'error', message: 'Ingresso de outro evento' };
          case 'not_paid':
            return { tone: 'error', message: 'Ingresso não pago' };
        }
      }
    }
    return {
      tone: 'error',
      message: err instanceof Error && err.message ? err.message : 'Não foi possível conferir o ingresso.',
    };
  }
}
