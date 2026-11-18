'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { CookieBanner } from '@/components/cookie-banner';
import { useConsent } from '@/lib/consent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * The admin panel and the Clerk login gate in front of it are internal —
 * only the operator ever reaches them. Counting those visits inflated every
 * number in a client-facing report with the operator's own usage.
 */
function isInternalPath(pathname: string): boolean {
  // /login is Clerk's catch-all route ([[...rest]]) — /login/sso-callback
  // and similar sub-paths need the same prefix match /admin already gets.
  return pathname.startsWith('/login') || pathname.startsWith('/admin');
}

/**
 * `@next/third-parties`'s <GoogleAnalytics> only calls `gtag('config', ...)`
 * once, on mount — it has no page-view tracking of its own. Once that config
 * call runs, gtag.js's *own* history-based auto-tracking takes over at the
 * browser level, independent of this React tree: a visitor who loads a
 * public page (mounting this component) and then navigates client-side into
 * `/admin` kept being counted there, because unmounting this component
 * doesn't undo gtag.js's already-running listener.
 *
 * Fix: disable that automatic tracking (`send_page_view: false`) and fire
 * every page_view ourselves, re-checking `isInternalPath` on every
 * navigation — not just on first mount.
 *
 * Nothing loads until the visitor accepts the cookie notice (LGPD). The
 * first page_view comes from the init script itself: when it runs, the
 * effect below has already fired with no `gtag` to call.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const consent = useConsent();
  const internal = isInternalPath(pathname);

  useEffect(() => {
    if (isInternalPath(pathname)) return;
    window.gtag?.('event', 'page_view', { page_path: pathname });
  }, [pathname]);

  // LGPD: o script do GA só entra depois de "Aceitar" no aviso de cookies.
  if (internal || consent !== 'granted') return <CookieBanner hidden={internal} />;

  return (
    <>
      <Script id="_next-ga" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="_next-ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
          gtag('event', 'page_view', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
