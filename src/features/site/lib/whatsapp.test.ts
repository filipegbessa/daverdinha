import { getWhatsAppUrl } from './whatsapp';

describe('getWhatsAppUrl', () => {
  it('builds a wa.me link with no prefilled message by default', () => {
    expect(getWhatsAppUrl()).toBe('https://wa.me/5521986509259');
  });

  it('builds a wa.me link with an encoded prefilled message', () => {
    expect(getWhatsAppUrl('Oi! Gostaria de saber mais')).toBe(
      'https://wa.me/5521986509259?text=Oi%21%20Gostaria%20de%20saber%20mais',
    );
  });
});
