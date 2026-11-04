import robots from './robots';

describe('robots', () => {
  beforeEach(() => {
    process.env.SITE_URL = 'https://daverdinha.com.br';
  });

  it('allows all crawlers, blocks the /site preview, and points to the sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: '/site' },
      sitemap: 'https://daverdinha.com.br/sitemap.xml',
    });
  });
});
