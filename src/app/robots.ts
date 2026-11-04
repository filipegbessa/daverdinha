import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL must be set to build robots.txt');
  }
  return {
    // Sem Disallow pra `/site` nem pras páginas de prévia (`/produtos`,
    // `/agenda`): elas dizem noindex na própria página, e um Disallow
    // impediria o Google de ler esse noindex — uma URL bloqueada ainda pode
    // ser indexada a partir de um link. Mesmo motivo de `/admin` usar header
    // em `next.config.ts`.
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
