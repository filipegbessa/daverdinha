/**
 * A mensagem de um erro capturado: a da API quando veio uma (o `apiFetch`
 * lança com o `message` do corpo), senão o texto de reserva da tela.
 */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
