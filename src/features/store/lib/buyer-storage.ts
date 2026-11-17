/**
 * Os dados de quem comprou, guardados só neste navegador pra próxima compra
 * já abrir preenchida (sem conta nem senha). O documento (CPF, CNPJ ou
 * passaporte) fica de fora de propósito: é o dado mais sensível e o mais
 * rápido de digitar de novo. A rua também não, porque vem sempre do CEP.
 */
export const BUYER_STORAGE_KEY = 'daverdinha:buyer:v1';

export interface SavedBuyer {
  name: string;
  email: string;
  phone: string;
  cep: string;
  number: string;
  complement: string;
}

const FIELDS: (keyof SavedBuyer)[] = ['name', 'email', 'phone', 'cep', 'number', 'complement'];

export function readBuyer(): SavedBuyer | null {
  try {
    const raw = localStorage.getItem(BUYER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const buyer = Object.fromEntries(
      FIELDS.map((field) => [field, typeof parsed[field] === 'string' ? parsed[field] : '']),
    ) as unknown as SavedBuyer;
    // Sem nome nem e-mail não há o que preencher.
    return buyer.name || buyer.email ? buyer : null;
  } catch {
    return null;
  }
}

/**
 * Junta com o que já estava salvo: a compra de ingresso não tem endereço e
 * não pode apagar o da última compra de produtos.
 */
export function saveBuyer(changes: Partial<SavedBuyer>): void {
  try {
    const current = readBuyer();
    const next = { ...current, ...changes };
    localStorage.setItem(
      BUYER_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(FIELDS.map((field) => [field, next[field] ?? '']))),
    );
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a próxima compra só abre vazia.
  }
}

export function clearBuyer(): void {
  try {
    localStorage.removeItem(BUYER_STORAGE_KEY);
  } catch {
    // Nada a fazer.
  }
}
