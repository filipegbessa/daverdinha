'use client';

import { usePathname } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';

export function Analytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // Not rendering the tag only covers a page load that lands on /admin. When
  // gtag is already on the page — say, from /login, where Clerk then moves to
  // /admin client-side — it keeps counting every history change as a page
  // view, and unmounting the component doesn't unload it. `ga-disable-<id>`
  // is gtag's own off switch, checked on every hit. It's set during render,
  // not in an effect, so it's already in place when the router pushes the
  // new URL and gtag reacts to it.
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = isAdmin;
  }

  if (isAdmin) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
