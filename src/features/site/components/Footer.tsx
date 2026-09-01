import Link from 'next/link';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-2 border-t border-moss-line px-6 py-8 text-sm text-ink-soft">
      <div className="flex gap-4">
        <Link href="https://www.instagram.com/daverdinha_/" target="_blank" className="underline underline-offset-4">
          @daverdinha_
        </Link>
        <Link href={getWhatsAppUrl('Oi! Vim pelo site da Da Verdinha 🌱')} target="_blank" className="underline underline-offset-4">
          Falar no WhatsApp
        </Link>
      </div>
      <p>© {new Date().getFullYear()} Da Verdinha</p>
    </footer>
  );
}
