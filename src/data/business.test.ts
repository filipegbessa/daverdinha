import { businessInfo, generateLocalBusinessJsonLd } from './business';

describe('businessInfo', () => {
  it('has the confirmed real business facts', () => {
    expect(businessInfo.name).toBe('Da Verdinha');
    expect(businessInfo.contact.phone.number).toBe('5521986509259');
    expect(businessInfo.contact.instagram.url).toBe('https://www.instagram.com/daverdinha_/');
    expect(businessInfo.address.formatted).toBe('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030');
    expect(businessInfo.areaServed).toEqual(['Zona Sul', 'Centro', 'Zona Portuária', 'Zona Norte']);
    expect(businessInfo.legal.cnpj).toBe('66.371.530/0001-54');
    expect(businessInfo.legal.razaoSocial).toBe('66.371.530 Alana Viana Moreno');
  });
});

describe('generateLocalBusinessJsonLd', () => {
  it('always includes name, telephone, and address (all now hardcoded, never conditional)', () => {
    const json = generateLocalBusinessJsonLd();
    expect(json['@type']).toBe('LocalBusiness');
    expect(json.name).toBe('Da Verdinha');
    expect(json.telephone).toBe('5521986509259');
    expect(json.address).toBe('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030');
    expect(json.sameAs).toEqual(['https://www.instagram.com/daverdinha_/']);
    expect(json.taxID).toBe('66.371.530/0001-54');
  });

  it('includes url only when NEXT_PUBLIC_SITE_URL is set', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(generateLocalBusinessJsonLd().url).toBeUndefined();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://daverdinha.com.br';
    expect(generateLocalBusinessJsonLd().url).toBe('https://daverdinha.com.br');
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });
});
