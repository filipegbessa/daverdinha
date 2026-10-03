import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL must be set to build robots.txt');
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
