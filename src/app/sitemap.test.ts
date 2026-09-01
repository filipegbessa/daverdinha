import sitemap from './sitemap';

describe('sitemap', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://daverdinha.com.br';
  });

  it('lists the homepage with a high priority', () => {
    const result = sitemap();
    expect(result).toEqual([
      {
        url: 'https://daverdinha.com.br',
        lastModified: expect.any(Date),
        changeFrequency: 'monthly',
        priority: 1,
      },
    ]);
  });
});
