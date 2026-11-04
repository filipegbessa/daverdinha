import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { MobileNav } from '@/features/site/components/MobileNav';
import { siteNav } from '@/features/site/components/site-nav';

export const WHATSAPP_GREETING = 'Oi! Vim pelo site da Daverdinha 🌱';

/**
 * Logo pequena com o nome ao lado (o nome é o que o Google e um leitor de
 * tela leem — a logo sozinha tinha `alt=""`), menu de navegação e o botão de
 * WhatsApp. No celular o menu vira gaveta e o WhatsApp fica no botão
 * flutuante, então o cabeçalho fixo ocupa pouco da tela.
 */
export function Header({ home }: { home: string }) {
  const links = siteNav(home);

  return (
    <header className="sticky top-0 z-20 border-b border-moss-line/70 bg-paper/90 px-4 py-2.5 backdrop-blur-md md:px-6">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href={home} className="flex items-center gap-2.5 font-serif text-xl font-semibold text-ink">
          <Image src="/logo.png" alt="" width={44} height={44} className="size-11 rounded-full shadow-soft" />
          Daverdinha
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm font-medium text-ink-soft">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-moss">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <ContactLink
            href={getWhatsAppUrl(WHATSAPP_GREETING)}
            channel="whatsapp"
            location="header"
            className={cn(
              buttonVariants({ variant: 'default', size: 'default' }),
              'hidden gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft sm:inline-flex',
            )}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </ContactLink>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
