export type CepCheckResult =
  | { status: 'covered'; bairro: string }
  | { status: 'not_covered'; bairro: string }
  | { status: 'unresolved' };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** "22220000" → "22220-000", enquanto a pessoa digita. */
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * "Entregamos no seu CEP?", perguntado à API (`GET /delivery-locations/check`),
 * que usa a mesma regra do bot: faixas de CEP cadastradas primeiro, BrasilAPI
 * depois, só bairros do Rio. Antes o site consultava a BrasilAPI direto e
 * podia responder diferente do WhatsApp. Nunca lança: falha, API sem URL ou
 * CEP incompleto viram `unresolved`.
 */
export async function checkCep(cep: string): Promise<CepCheckResult> {
  const digits = onlyDigits(cep);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (digits.length !== 8 || !apiUrl) return { status: 'unresolved' };

  try {
    const response = await fetch(`${apiUrl}/delivery-locations/check?cep=${digits}`);
    if (!response.ok) return { status: 'unresolved' };
    const data = (await response.json()) as { status?: string; bairro?: string };
    if ((data.status === 'covered' || data.status === 'not_covered') && data.bairro) {
      return { status: data.status, bairro: data.bairro };
    }
    return { status: 'unresolved' };
  } catch {
    return { status: 'unresolved' };
  }
}
