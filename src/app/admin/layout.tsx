'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { PushNotificationBanner } from '@/components/push-notification-banner';
import { InstallAppNavItem } from '@/components/install-app-nav-item';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import type { Conversation } from '@/features/admin/types/admin';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/destaques', label: 'Destaques' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/conversas', label: 'Conversas' },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const { data: conversations } = useApiResource<Conversation[]>('/conversations', { pollIntervalMs: 15000 });
  const unreadCount = conversations?.filter((c) => c.unread).length ?? 0;

  useEffect(() => {
    // Chrome/Edge/Android PWAs support the Badging API; Safari/iOS and
    // browser-tab (non-installed) contexts don't — feature-detect at the
    // call site rather than assuming availability.
    if (unreadCount > 0) {
      if (typeof navigator.setAppBadge === 'function') {
        navigator.setAppBadge(unreadCount).catch(() => {});
      }
    } else if (typeof navigator.clearAppBadge === 'function') {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      <PushNotificationBanner />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-none items-center justify-between border-b border-moss-line bg-sand p-4 md:hidden">
          <p className="font-serif text-lg font-semibold text-moss">Daverdinha</p>
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={navOpen}
            className="rounded-lg p-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            ☰
          </button>
        </div>

        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/40 md:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav
          aria-label="Navegação do admin"
          className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-none -translate-x-full flex-col border-r border-moss-line bg-sand p-6 transition-transform duration-200 md:static md:translate-x-0 ${
            navOpen ? 'translate-x-0' : ''
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <p className="font-serif text-lg font-semibold text-moss">Daverdinha</p>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Fechar menu"
              className="rounded-lg p-1 text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss md:hidden"
            >
              ✕
            </button>
          </div>
          <ul className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const showUnreadBadge = item.href === '/admin/conversas' && unreadCount > 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setNavOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                      active ? 'bg-moss font-medium text-paper' : 'text-ink-soft hover:bg-paper hover:text-ink'
                    }`}
                  >
                    <span>{item.label}</span>
                    {showUnreadBadge && (
                      <span
                        aria-hidden="true"
                        className="ml-2 inline-flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-berry px-1.5 text-xs font-semibold text-white"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <InstallAppNavItem />
          </ul>
          <div className="mt-8 border-t border-moss-line pt-4">
            <UserButton />
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
