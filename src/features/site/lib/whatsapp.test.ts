import { getWhatsAppUrl } from './whatsapp';

describe('getWhatsAppUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '5521999999999';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalEnv;
  });

  it('builds a wa.me link with no prefilled message by default', () => {
    expect(getWhatsAppUrl()).toBe('https://wa.me/5521999999999');
  });

  it('builds a wa.me link with an encoded prefilled message', () => {
    expect(getWhatsAppUrl('Oi! Gostaria de saber mais')).toBe(
      'https://wa.me/5521999999999?text=Oi%21%20Gostaria%20de%20saber%20mais',
    );
  });
});
