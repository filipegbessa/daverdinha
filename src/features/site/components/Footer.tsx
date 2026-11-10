import Link from 'next/link';
import { businessInfo } from '@/data/business';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { siteNav } from '@/features/site/components/site-nav';
import { WHATSAPP_GREETING } from '@/features/site/components/Header';

/**
 * Nome, endereço e telefone em todas as páginas, escritos igual ao perfil da
 * empresa no Google Maps — a consistência entre os dois é um dos sinais mais
 * fortes da busca local.
 */
export function Footer({ home }: { home: string }) {
  const { address, contact, legal } = businessInfo;

  return (
    // No celular, espaço extra embaixo pro botão flutuante de WhatsApp não cobrir a última linha.
    <footer className="bg-ink px-6 pt-12 pb-24 text-sm text-paper/75 sm:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-2">
          <p className="font-serif text-lg font-semibold text-paper">Daverdinha · Ateliê de Plantas</p>
          <address className="not-italic">
            {address.street}, {address.neighborhood}
            <br />
            {address.city} - {address.state}, {address.zipCode}
          </address>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <ContactLink
              href={getWhatsAppUrl(WHATSAPP_GREETING)}
              channel="whatsapp"
              location="footer"
              className="underline underline-offset-4 hover:text-paper"
            >
              WhatsApp {contact.phone.display}
            </ContactLink>
            <ContactLink
              href={contact.instagram.url}
              channel="instagram"
              location="footer"
              className="underline underline-offset-4 hover:text-paper"
            >
              {contact.instagram.handle}
            </ContactLink>
            <ContactLink
              href={`mailto:${contact.email}`}
              channel="email"
              location="footer"
              className="underline underline-offset-4 hover:text-paper"
            >
              {contact.email}
            </ContactLink>
          </p>
        </div>

        <nav aria-label="Rodapé">
          <p className="mb-2 font-semibold text-paper">Navegar</p>
          <ul className="space-y-1.5">
            {siteNav(home).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-paper">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-1.5">
          <p className="mb-2 font-semibold text-paper">Legal</p>
          <Link href="/politica-de-privacidade" className="block underline underline-offset-4 hover:text-paper">
            Política de Privacidade
          </Link>
          <p>{legal.razaoSocial}</p>
          <p>CNPJ {legal.cnpj}</p>
          <p>© {new Date().getFullYear()} Daverdinha</p>
        </div>
      </div>
    </footer>
  );
}
