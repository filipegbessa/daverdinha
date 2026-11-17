import { isValidEmail, maskPhone, validateCheckout, type CheckoutFormValues } from './checkout-form';

const valid: CheckoutFormValues = {
  name: 'Maria Souza',
  email: 'maria@exemplo.com',
  phone: '(21) 99999-8888',
  document: '111.444.777-35',
  deliveryMethod: 'delivery',
  cep: '22220-000',
  street: 'Rua do Catete',
  number: '100',
  complement: '',
  notes: '',
  acceptedPolicy: true,
};

describe('maskPhone', () => {
  it('formats mobile and landline numbers as they are typed', () => {
    expect(maskPhone('2')).toBe('(2');
    expect(maskPhone('2199')).toBe('(21) 99');
    expect(maskPhone('2133334444')).toBe('(21) 3333-4444');
    expect(maskPhone('21999998888')).toBe('(21) 99999-8888');
    expect(maskPhone('219999988887777')).toBe('(21) 99999-8888');
  });
});

describe('validateCheckout', () => {
  it('accepts a complete delivery order', () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it('only asks for the address when the order is delivered', () => {
    const pickup = { ...valid, deliveryMethod: 'pickup' as const, cep: '', street: '', number: '' };
    expect(validateCheckout(pickup)).toEqual({});

    expect(validateCheckout({ ...valid, cep: '2222', street: ' ', number: '' })).toEqual({
      cep: 'Informe um CEP com 8 números.',
      street: 'Informe o CEP pra preencher a rua.',
      number: 'Informe o número (ou "s/n").',
    });
  });

  it('blames the CEP, not the buyer, when ViaCEP could not find the street', () => {
    // CEP completo mas rua vazia: a ViaCEP não achou (o campo não é digitado).
    expect(validateCheckout({ ...valid, street: '' })).toEqual({
      street: 'Não encontramos a rua desse CEP. Confira os números.',
    });
  });

  it('caps name and email at the 64 characters Pagar.me accepts', () => {
    const email = (length: number) => `${'a'.repeat(length - '@exemplo.com'.length)}@exemplo.com`;
    expect(validateCheckout({ ...valid, name: 'M'.repeat(64), email: email(64) })).toEqual({});
    expect(validateCheckout({ ...valid, name: 'M'.repeat(65), email: email(65) })).toEqual({
      name: 'Use até 64 caracteres.',
      email: 'Use um e-mail de até 64 caracteres.',
    });
    expect(isValidEmail(email(64))).toBe(true);
    expect(isValidEmail(email(65))).toBe(false);
  });

  it('checks contact details and the policy', () => {
    expect(validateCheckout({ ...valid, name: 'M', email: 'maria@', phone: '9999', acceptedPolicy: false })).toEqual({
      name: 'Informe seu nome.',
      email: 'Informe um e-mail válido.',
      phone: 'Informe um WhatsApp com DDD.',
      acceptedPolicy: 'Confirme que leu a política de trocas.',
    });
  });

  it('accepts a CNPJ or a passport, and rejects anything else', () => {
    expect(validateCheckout({ ...valid, document: '11.222.333/0001-81' })).toEqual({});
    expect(validateCheckout({ ...valid, document: 'AB123456' })).toEqual({});
    expect(validateCheckout({ ...valid, document: '123' })).toEqual({
      document: 'Informe um CPF ou CNPJ válido.',
    });
  });

  it('leaves the document optional: the Pagar.me checkout asks for it when it is missing', () => {
    expect(validateCheckout({ ...valid, document: '' })).toEqual({});
    expect(validateCheckout({ ...valid, document: '   ' })).toEqual({});
  });
});
