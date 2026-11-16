/**
 * Busca a rua do CEP na ViaCEP, pra preencher sozinho o endereço no checkout
 * (o campo não é editável — o preenchimento é sempre automático). Nunca
 * lança: CEP incompleto, erro de rede, CEP inexistente ou resposta sem
 * `logradouro` viram `null`, e a tela decide o que mostrar.
 */
export async function fetchStreetByCep(cep: string): Promise<string | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;
    const data = (await response.json()) as { erro?: boolean; logradouro?: string };
    if (data.erro || !data.logradouro) return null;
    return data.logradouro;
  } catch {
    return null;
  }
}
