import type { DeliveryZone } from '@/features/site/lib/delivery-zones';

export type CepCheckResult =
  | { status: 'covered'; bairro: string }
  | { status: 'not_covered'; bairro: string }
  | { status: 'unresolved' };

/** Mesma normalização que o bot usa pra comparar bairro: sem acento, sem caixa. */
export function normalizeBairro(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** "22220000" → "22220-000", enquanto a pessoa digita. */
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Verificação de CEP feita no navegador, provisória: consulta a BrasilAPI
 * (a mesma que o bot usa como plano B) e compara o bairro com a lista de
 * bairros atendidos que a página já tem.
 *
 * O bot primeiro olha as faixas de CEP cadastradas no banco e só depois cai
 * na BrasilAPI. Esta versão pula a primeira etapa, então em casos raros pode
 * responder diferente do WhatsApp. O destino é um endpoint público na API
 * (`GET /delivery-locations/check`) que reaproveite a lógica do bot — ver
 * `docs/plans/2026-11-04-agenda-eventos.md` no daverdinha-api.
 */
export async function checkCep(cep: string, zones: DeliveryZone[]): Promise<CepCheckResult> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return { status: 'unresolved' };

  let bairro: string | undefined;
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (!response.ok) return { status: 'unresolved' };
    const data = (await response.json()) as { neighborhood?: string; city?: string };
    if (data.city && normalizeBairro(data.city) !== 'rio de janeiro') {
      return { status: 'not_covered', bairro: data.neighborhood || data.city };
    }
    bairro = data.neighborhood;
  } catch {
    return { status: 'unresolved' };
  }
  if (!bairro) return { status: 'unresolved' };

  const target = normalizeBairro(bairro);
  const covered = zones.some((zone) => zone.bairros.some((b) => normalizeBairro(b) === target));
  return covered ? { status: 'covered', bairro } : { status: 'not_covered', bairro };
}
