import { BUSINESS_INFO, generateLocalBusinessJsonLd } from './business-info';

describe('BUSINESS_INFO', () => {
  it('has the confirmed facts filled in', () => {
    expect(BUSINESS_INFO.name).toBe('Da Verdinha');
    expect(BUSINESS_INFO.instagramUrl).toBe('https://www.instagram.com/daverdinha_/');
    expect(BUSINESS_INFO.areaServed).toEqual(['Zona Sul', 'Centro', 'Zona Portuária', 'Zona Norte']);
  });
});

describe('generateLocalBusinessJsonLd', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('always includes the confirmed core fields', () => {
    const json = generateLocalBusinessJsonLd();
    expect(json['@type']).toBe('LocalBusiness');
    expect(json.name).toBe('Da Verdinha');
    expect(json.sameAs).toEqual(['https://www.instagram.com/daverdinha_/']);
  });

  it('omits telephone/address when the env vars are unset', () => {
    delete process.env.NEXT_PUBLIC_BUSINESS_PHONE;
    delete process.env.NEXT_PUBLIC_BUSINESS_ADDRESS;
    const json = generateLocalBusinessJsonLd();
    expect(json.telephone).toBeUndefined();
    expect(json.address).toBeUndefined();
  });

  it('includes telephone/address once the env vars are set', () => {
    process.env.NEXT_PUBLIC_BUSINESS_PHONE = '+5521999999999';
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS = 'Santo Cristo, Rio de Janeiro - RJ';
    const json = generateLocalBusinessJsonLd();
    expect(json.telephone).toBe('+5521999999999');
    expect(json.address).toBe('Santo Cristo, Rio de Janeiro - RJ');
  });
});
