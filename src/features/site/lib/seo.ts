import type { Metadata } from 'next';
import { getSiteMode } from '@/lib/site-mode';

/**
 * Antes do lançamento, as páginas do site completo existem pra cliente
 * validar, mas não podem entrar no Google. Um `noindex` na página (e não um
 * Disallow no robots.txt): Disallow só impede o rastreamento, e uma URL
 * bloqueada ainda pode ser indexada por um link sem o Google nunca ver o
 * noindex — o mesmo motivo de `/admin` usar header em `next.config.ts`.
 */
export function prelaunchRobots(): Pick<Metadata, 'robots'> {
  return getSiteMode() === 'full' ? {} : { robots: { index: false, follow: false } };
}

/**
 * Metadados de uma página interna: título, descrição, canonical e prévia de
 * link. `indexBeforeLaunch` é pra página que já é pública antes do
 * lançamento (a política de privacidade, linkada pela página "em breve" e
 * listada no sitemap desde sempre).
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  indexBeforeLaunch = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  indexBeforeLaunch?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(indexBeforeLaunch ? {} : prelaunchRobots()),
    openGraph: {
      title,
      description,
      type: 'website',
      url: path,
      images: [image ? { url: image } : { url: '/logo.png', width: 1200, height: 1200, alt: 'Daverdinha' }],
    },
  };
}
