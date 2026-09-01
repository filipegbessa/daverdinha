import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-moss-line px-6 py-4">
      <span className="font-semibold text-lg">Da Verdinha</span>
      <Button asChild className="bg-moss hover:bg-moss/90">
        <Link href={getWhatsAppUrl('Oi! Vim pelo site da Da Verdinha 🌱')} target="_blank">
          Falar no WhatsApp
        </Link>
      </Button>
    </header>
  );
}
