import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-moss-line px-6 py-4">
      <span className="font-semibold text-lg">Da Verdinha</span>
      <Link
        href={getWhatsAppUrl('Oi! Vim pelo site da Da Verdinha 🌱')}
        target="_blank"
        className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'bg-moss hover:bg-moss/90')}
      >
        Falar no WhatsApp
      </Link>
    </header>
  );
}
