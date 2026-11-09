import { maskPhone, validateCheckout, type CheckoutFormValues } from './checkout-form';

const valid: CheckoutFormValues = {
  name: 'Maria Souza',
  email: 'maria@exemplo.com',
  phone: '(21) 99999-8888',
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
      street: 'Informe a rua.',
      number: 'Informe o número (ou "s/n").',
    });
  });

  it('checks contact details and the policy', () => {
    expect(
      validateCheckout({ ...valid, name: 'M', email: 'maria@', phone: '9999', acceptedPolicy: false }),
    ).toEqual({
      name: 'Informe seu nome.',
      email: 'Informe um e-mail válido.',
      phone: 'Informe um WhatsApp com DDD.',
      acceptedPolicy: 'Confirme que leu a política de trocas.',
    });
  });
});
