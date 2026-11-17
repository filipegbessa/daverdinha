'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PushNotificationBanner } from '@/features/admin/components/PushNotificationBanner';
import { InstallAppNavItem } from '@/features/admin/components/InstallAppNavItem';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import type { BotSettings, ConversationList } from '@/features/admin/types/admin';
import { BOT_SETTINGS_CHANGED, isWhatsappModuleOn } from '@/features/admin/lib/bot-settings-events';

type NavItem = { href: string; label: string };

/**
 * O menu em três contextos: a loja (vender e entregar), o site (o que aparece
 * pro público) e o bot do WhatsApp (atendimento). O Dashboard fica solto no
 * topo, porque liga e desliga os três.
 */
const NAV_GROUPS: { id: string; title?: string; items: NavItem[] }[] = [
  { id: 'inicio', items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    id: 'loja',
    title: 'Loja',
    items: [
      { href: '/admin/pedidos', label: 'Pedidos' },
      { href: '/admin/clientes', label: 'Clientes' },
      { href: '/admin/produtos', label: 'Produtos' },
      { href: '/admin/categorias', label: 'Categorias' },
      { href: '/admin/entregas', label: 'Entregas' },
      { href: '/admin/promocoes', label: 'Promoções' },
      { href: '/admin/loja', label: 'Configurações da loja' },
    ],
  },
  { id: 'site', title: 'Site', items: [{ href: '/admin/eventos', label: 'Eventos' }] },
  {
    id: 'bot',
    title: 'Bot (WhatsApp)',
    items: [
      { href: '/admin/conversas', label: 'Conversas' },
      { href: '/admin/menu', label: 'Menu' },
      { href: '/admin/mensagens', label: 'Mensagens' },
      { href: '/admin/marcadores', label: 'Marcadores' },
    ],
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** As páginas do grupo Bot: somem do menu e voltam pro Dashboard com o módulo desligado. */
const BOT_HREFS = NAV_GROUPS.find((group) => group.id === 'bot')!.items.map((item) => item.href);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  // O módulo de WhatsApp, ligado e desligado no Dashboard. Enquanto não
  // carrega (ou se falhar), conta como ligado: esconder por engano é pior.
  const { data: botSettings, refetch: refetchBotSettings } = useApiResource<BotSettings>('/bot-settings');
  const whatsappOn = isWhatsappModuleOn(botSettings);
  const onBotPage = BOT_HREFS.some((href) => isActiveRoute(pathname, href));
  // Asks for a single row and reads the count off the envelope: the badge
  // needs the total, not the conversations, and this used to pull the whole
  // table every 15 seconds just to run .filter() over it. Sem o módulo de
  // WhatsApp, não há o que contar.
  const { data } = useApiResource<ConversationList>(whatsappOn ? '/conversations?perPage=1' : null, {
    pollIntervalMs: 15000,
  });

  useEffect(() => {
    window.addEventListener(BOT_SETTINGS_CHANGED, refetchBotSettings);
    return () => window.removeEventListener(BOT_SETTINGS_CHANGED, refetchBotSettings);
  }, [refetchBotSettings]);

  useEffect(() => {
    if (!whatsappOn && onBotPage) router.replace('/admin');
  }, [whatsappOn, onBotPage, router]);
  const unreadCount = whatsappOn ? (data?.unreadTotal ?? 0) : 0;
  const groups = whatsappOn ? NAV_GROUPS : NAV_GROUPS.filter((group) => group.id !== 'bot');

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
    <div className="flex h-screen flex-col bg-background text-foreground print:h-auto">
      {/* Na impressão (pedido pra entrega), só o conteúdo da página sai no papel. */}
      <div className="print:hidden">
        <PushNotificationBanner />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-none items-center justify-between border-b border-border bg-muted p-4 md:hidden print:hidden">
          <p className="text-lg font-semibold">Daverdinha</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={navOpen}
          >
            <Menu aria-hidden="true" />
          </Button>
        </div>

        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav
          aria-label="Navegação do admin"
          className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-none -translate-x-full flex-col border-r border-border bg-muted p-6 transition-transform duration-200 md:static md:translate-x-0 print:hidden ${
            navOpen ? 'translate-x-0' : ''
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <p className="text-lg font-semibold">Daverdinha</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setNavOpen(false)}
              aria-label="Fechar menu"
              className="md:hidden"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.id}>
                {group.title && (
                  <p
                    id={`nav-group-${group.id}`}
                    className="mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {group.title}
                  </p>
                )}
                <ul className="space-y-1" aria-labelledby={group.title ? `nav-group-${group.id}` : undefined}>
                  {group.items.map((item) => {
                    const active = isActiveRoute(pathname, item.href);
                    const showUnreadBadge = item.href === '/admin/conversas' && unreadCount > 0;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setNavOpen(false)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                            active
                              ? 'bg-primary font-medium text-primary-foreground'
                              : 'text-muted-foreground hover:bg-background hover:text-foreground'
                          }`}
                        >
                          <span>{item.label}</span>
                          {showUnreadBadge && (
                            <span
                              aria-hidden="true"
                              className="ml-2 inline-flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-primary-foreground"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <ul>
              <InstallAppNavItem />
            </ul>
          </div>
          <div className="mt-8 border-t border-border pt-4">
            <UserButton />
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  );
}
