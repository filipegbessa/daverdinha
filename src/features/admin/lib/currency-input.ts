/** Maior valor aceito (R$ 999.999,99) — só pra não deixar o número de centavos crescer sem limite. */
export const MAX_CENTS = 99_999_999;

/**
 * Os dígitos do que já foi digitado, reinterpretados como centavos: cada
 * tecla empurra o valor pra esquerda ("5990" vira R$ 59,90). É a máscara dos
 * campos de valor do admin (preço, frete, parcela mínima), sempre exibidos
 * com `formatCurrency`.
 */
export function centsFromInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return Math.min(Number(digits || '0'), MAX_CENTS);
}
