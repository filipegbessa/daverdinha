import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/destaques', label: 'Destaques' },
  { href: '/admin/conversas', label: 'Conversas' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-56 flex-none border-r border-moss-line bg-sand p-4">
        <p className="mb-6 font-semibold">Daverdinha</p>
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded px-2 py-1 hover:bg-paper">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <UserButton />
        </div>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
