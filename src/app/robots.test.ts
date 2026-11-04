import robots from './robots';

describe('robots', () => {
  beforeEach(() => {
    process.env.SITE_URL = 'https://daverdinha.com.br';
  });

  // /site e as páginas de prévia ficam fora do Google pelo noindex na
  // própria página — um Disallow aqui esconderia esse noindex do crawler.
  it('allows all crawlers and points to the sitemap, without blocking the preview', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://daverdinha.com.br/sitemap.xml',
    });
  });
});
