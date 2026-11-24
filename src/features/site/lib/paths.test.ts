import { isSitePath, toSitePath } from './paths';

describe('links do botão de um destaque', () => {
  const originalSiteUrl = process.env.SITE_URL;

  beforeEach(() => {
    process.env.SITE_URL = 'https://www.daverdinha.com.br';
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
  });

  it('turns a full URL of the site itself into a path, with or without www', () => {
    expect(toSitePath('https://www.daverdinha.com.br/agenda')).toBe('/agenda');
    expect(toSitePath('https://daverdinha.com.br/produtos/vasos?ordem=preco#topo')).toBe(
      '/produtos/vasos?ordem=preco#topo',
    );
  });

  it('keeps paths and links to other sites as they are', () => {
    expect(toSitePath('/agenda')).toBe('/agenda');
    expect(toSitePath('https://instagram.com/daverdinha')).toBe('https://instagram.com/daverdinha');
  });

  it('keeps every link as it is without SITE_URL', () => {
    delete process.env.SITE_URL;
    expect(toSitePath('https://www.daverdinha.com.br/agenda')).toBe('https://www.daverdinha.com.br/agenda');
  });

  it('tells a site path from a link that leaves the site', () => {
    expect(isSitePath('/agenda')).toBe(true);
    expect(isSitePath('https://instagram.com/daverdinha')).toBe(false);
    expect(isSitePath('//instagram.com/daverdinha')).toBe(false);
  });
});
