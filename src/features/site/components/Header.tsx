import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { siteButtonClass } from '@/features/site/components/SiteButton';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { MobileNav } from '@/features/site/components/MobileNav';
import { siteNav } from '@/features/site/components/site-nav';
import { CartLink } from '@/features/store/components/CartLink';
import { WHATSAPP_GREETING } from '@/features/site/lib/whatsapp-messages';

/**
 * Logo horizontal (já com o nome escrito, por isso o `alt` é o nome), menu de navegação e o botão de
 * WhatsApp. No celular o menu vira gaveta e o WhatsApp fica no botão
 * flutuante, então o cabeçalho fixo ocupa pouco da tela.
 */
export function Header({ home, storeEnabled = false }: { home: string; storeEnabled?: boolean }) {
  const links = siteNav(home);

  return (
    // `relative` aqui, e não no container de dentro: a gaveta do celular se
    // posiciona contra o cabeçalho inteiro e ocupa a largura toda da tela.
    <header className="sticky top-0 z-20 border-b border-moss-line/70 bg-paper/90 px-4 py-2.5 backdrop-blur-md md:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href={home} className="shrink-0">
          {/* A logo horizontal já traz o nome escrito; o `alt` é o que o Google e o leitor de tela leem. */}
          <Image src="/logo-horizontal.png" alt="Daverdinha" width={158} height={44} priority className="h-11 w-auto" />
        </Link>

        {/* Só a partir de `lg`: entre 768 e ~800 px os 5 links, a logo e o botão não cabem numa linha. */}
        <nav aria-label="Principal" className="hidden lg:block">
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
            className={siteButtonClass({ size: 'sm', className: 'hidden sm:inline-flex' })}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </ContactLink>
          {storeEnabled && <CartLink />}
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
