'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/destaques', label: 'Destaques' },
  { href: '/admin/conversas', label: 'Conversas' },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <nav
        aria-label="Navegação do admin"
        className="flex w-56 flex-none flex-col border-r border-moss-line bg-sand p-6"
      >
        <p className="mb-8 font-serif text-lg font-semibold text-moss">Daverdinha</p>
        <ul className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                    active ? 'bg-moss font-medium text-paper' : 'text-ink-soft hover:bg-paper hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 border-t border-moss-line pt-4">
          <UserButton />
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
