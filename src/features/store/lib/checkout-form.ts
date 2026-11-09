import { onlyDigits } from '@/features/site/lib/cep-check';

/** O que a pessoa preenche no `/checkout`, como texto (máscaras incluídas). */
export interface CheckoutFormValues {
  name: string;
  email: string;
  phone: string;
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
  return rest.length > split
    ? `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`
    : `(${area}) ${rest}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * As mesmas regras da API (`POST /checkout`), conferidas antes de enviar pra
 * mensagem aparecer no campo, e não como um erro genérico depois.
 */
export function validateCheckout(values: CheckoutFormValues): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};
  const name = values.name.trim();
  if (name.length < 2 || name.length > 100) errors.name = 'Informe seu nome.';
  if (!EMAIL.test(values.email.trim())) errors.email = 'Informe um e-mail válido.';
  const phone = onlyDigits(values.phone);
  if (phone.length < 10 || phone.length > 11) errors.phone = 'Informe um WhatsApp com DDD.';
  if (values.deliveryMethod === 'delivery') {
    if (onlyDigits(values.cep).length !== 8) errors.cep = 'Informe um CEP com 8 números.';
    if (!values.street.trim()) errors.street = 'Informe a rua.';
    if (!values.number.trim()) errors.number = 'Informe o número (ou "s/n").';
  }
  if (values.notes.length > 500) errors.notes = 'Use até 500 caracteres.';
  if (!values.acceptedPolicy) errors.acceptedPolicy = 'Confirme que leu a política de trocas.';
  return errors;
}
