/**
 * Conversão entre o `<input type="datetime-local">` do admin, que não tem
 * fuso, e a data ISO em UTC que a API guarda. O horário digitado é sempre o
 * do Rio, qualquer que seja o fuso do navegador de quem cadastra.
 *
 * O Brasil não tem horário de verão desde 2019, então o Rio é sempre -03:00.
 */
const RIO_OFFSET = '-03:00';
const RIO_OFFSET_MS = 3 * 60 * 60 * 1000;

/** `"2026-11-21T13:00:00.000Z"` → `"2026-11-21T10:00"` (horário do Rio). */
export function toDatetimeLocal(iso: string): string {
  return new Date(new Date(iso).getTime() - RIO_OFFSET_MS).toISOString().slice(0, 16);
}

/** `"2026-11-21T10:00"` (horário do Rio) → `"2026-11-21T13:00:00.000Z"`. `null` se vazio ou inválido. */
export function fromDatetimeLocal(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${RIO_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
