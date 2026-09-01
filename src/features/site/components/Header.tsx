import Link from 'next/link';
import { Leaf, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-moss-line/70 bg-paper/85 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
          <Leaf className="size-5 text-moss" strokeWidth={2} aria-hidden="true" />
          Da Verdinha
        </span>
        <Link
          href={getWhatsAppUrl('Oi! Vim pelo site da Da Verdinha 🌱')}
          target="_blank"
          className={cn(
            buttonVariants({ variant: 'default', size: 'default' }),
            'gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
          )}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Falar no WhatsApp
        </Link>
      </div>
    </header>
  );
}
