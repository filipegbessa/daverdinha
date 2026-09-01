import robots from './robots';

describe('robots', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://daverdinha.com.br';
  });

  it('allows all crawlers and points to the sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://daverdinha.com.br/sitemap.xml',
    });
  });
});
