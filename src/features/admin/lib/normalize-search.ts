/** Sem acento, sem caixa e sem espaço nas pontas: "Suculênta " acha "suculenta". */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
