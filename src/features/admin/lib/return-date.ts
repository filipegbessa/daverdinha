/**
 * A data de volta da pausa da loja é um dia, no fuso do Rio (UTC−3 o ano
 * todo, sem horário de verão): a loja reabre à meia-noite daqui. O campo
 * `date` do navegador trabalha com "AAAA-MM-DD"; a API guarda o instante.
 */
const RIO_OFFSET_MS = 3 * 60 * 60 * 1000;

/** "2027-01-06" → "2027-01-06T03:00:00.000Z"; vazio → `null` (sem data). */
export function returnDateToIso(date: string): string | null {
  return date ? `${date}T03:00:00.000Z` : null;
}

/** O inverso, pro campo: o dia no Rio daquele instante. */
export function isoToReturnDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() - RIO_OFFSET_MS).toISOString().slice(0, 10);
}

/** "6 de jan." pra mostrar no Dashboard e no aviso do site. */
export function formatReturnDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }).format(
    new Date(iso),
  );
}
