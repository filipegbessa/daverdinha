import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL must be set to build robots.txt');
  }
  return {
    // `/site` é a pré-visualização do site completo pra cliente validar
    // enquanto `/` mostra "em breve" — não é secreta, só não deve aparecer
    // no Google antes do lançamento (ver src/app/site/page.tsx).
    rules: { userAgent: '*', allow: '/', disallow: '/site' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
