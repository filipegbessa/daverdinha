/**
 * Erro de resposta da API. A mensagem continua sendo o que as telas mostram;
 * `status` e `body` servem a quem precisa decidir pelo motivo (ex.: o 409 do
 * check-in pelo QR traz `reason`).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
