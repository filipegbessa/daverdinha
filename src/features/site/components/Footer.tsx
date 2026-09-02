import Link from 'next/link';
import { AtSign, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { businessInfo } from '@/data/business';

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-moss-line px-6 py-10 text-sm text-ink-soft">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Link
          href="https://www.instagram.com/daverdinha_/"
          target="_blank"
          className="flex items-center gap-1.5 text-ink-soft underline underline-offset-4"
        >
          <AtSign className="size-4" aria-hidden="true" />
          @daverdinha_
        </Link>
        <Link
          href={getWhatsAppUrl('Oi! Vim pelo site da Daverdinha 🌱')}
          target="_blank"
          className="flex items-center gap-1.5 text-ink-soft underline underline-offset-4"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Falar no WhatsApp
        </Link>
        <Link href="/politica-de-privacidade" className="text-ink-soft underline underline-offset-4">
          Política de Privacidade
        </Link>
      </div>
      <p>© {new Date().getFullYear()} Daverdinha</p>
      <p className="text-xs">CNPJ {businessInfo.legal.cnpj}</p>
    </footer>
  );
}
