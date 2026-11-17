import { onlyDigits } from '@/features/site/lib/cep-check';
import { parseDocument } from '@/features/store/lib/document';

/** O que a pessoa preenche no `/checkout`, como texto (máscaras incluídas). */
export interface CheckoutFormValues {
  name: string;
  email: string;
  phone: string;
  document: string;
  deliveryMethod: 'pickup' | 'delivery';
  cep: string;
  street: string;
  number: string;
  complement: string;
  notes: string;
  acceptedPolicy: boolean;
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

/** "21999998888" → "(21) 99999-8888", enquanto a pessoa digita. */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  return rest.length > split ? `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}` : `(${area}) ${rest}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Limite do Pagar.me pro comprador do link de pagamento (nome e e-mail com até
 * 64 caracteres), o mesmo do `CustomerDto` da API. Vai no `maxLength` dos
 * campos e na validação.
 */
export const CUSTOMER_NAME_MAX = 64;
export const CUSTOMER_EMAIL_MAX = 64;

/**
 * Nome e sobrenome: pelo menos duas palavras com letra, a mesma regra do
 * `CustomerDto` da API (o checkout do Pagar.me exige o nome completo).
 */
const FULL_NAME = /^\S*\p{L}\S*(?:\s+\S*\p{L}\S*)+$/u;

export function isFullName(value: string): boolean {
  return FULL_NAME.test(value.trim());
}

/** O mesmo teste de e-mail do checkout, pra outros formulários do site. */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= CUSTOMER_EMAIL_MAX && EMAIL.test(email);
}

/**
 * Quem compra: as regras do `CustomerDto` da API, as mesmas no checkout de
 * produtos e na compra de ingresso.
 */
export function validateCustomer(values: Pick<CheckoutFormValues, 'name' | 'email' | 'phone' | 'document'>) {
  const errors: Partial<Record<'name' | 'email' | 'phone' | 'document', string>> = {};
  const name = values.name.trim();
  if (name.length < 2) errors.name = 'Informe seu nome.';
  else if (!isFullName(name)) errors.name = 'Informe nome e sobrenome.';
  else if (name.length > CUSTOMER_NAME_MAX) errors.name = `Use até ${CUSTOMER_NAME_MAX} caracteres.`;
  const email = values.email.trim();
  if (email.length > CUSTOMER_EMAIL_MAX) errors.email = `Use um e-mail de até ${CUSTOMER_EMAIL_MAX} caracteres.`;
  else if (!EMAIL.test(email)) errors.email = 'Informe um e-mail válido.';
  const phone = onlyDigits(values.phone);
  if (phone.length < 10 || phone.length > 11) errors.phone = 'Informe um WhatsApp com DDD.';
  // Opcional: sem ele, o comprador preenche na própria página do Pagar.me.
  const document = values.document.trim();
  if (document && !parseDocument(document)) errors.document = 'Informe um CPF ou CNPJ válido.';
  return errors;
}

/**
 * As mesmas regras da API (`POST /checkout`), conferidas antes de enviar pra
 * mensagem aparecer no campo, e não como um erro genérico depois.
 */
export function validateCheckout(values: CheckoutFormValues): CheckoutFormErrors {
  const errors: CheckoutFormErrors = validateCustomer(values);
  if (values.deliveryMethod === 'delivery') {
    const cepComplete = onlyDigits(values.cep).length === 8;
    if (!cepComplete) errors.cep = 'Informe um CEP com 8 números.';
    // Rua vem sozinha do CEP (ViaCEP), nunca digitada: vazia com CEP completo
    // é a ViaCEP não achando; vazia sem CEP é só faltar o CEP ainda.
    if (!values.street.trim()) {
      errors.street = cepComplete
        ? 'Não encontramos a rua desse CEP. Confira os números.'
        : 'Informe o CEP pra preencher a rua.';
    }
    if (!values.number.trim()) errors.number = 'Informe o número (ou "s/n").';
  }
  if (values.notes.length > 500) errors.notes = 'Use até 500 caracteres.';
  if (!values.acceptedPolicy) errors.acceptedPolicy = 'Confirme que leu a política de trocas.';
  return errors;
}
