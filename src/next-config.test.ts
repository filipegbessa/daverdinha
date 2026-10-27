import nextConfig from '../next.config';

describe('next.config headers', () => {
  it('tells crawlers not to index anything under /admin, the root included', async () => {
    const rules = await nextConfig.headers!();
    const admin = rules.find((rule) => rule.source === '/admin/:path*');

    expect(admin?.headers).toEqual([{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]);
  });
});
