import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function Hero() {
  return (
    <section className="px-6 py-20 text-center">
      <h1 className="text-4xl font-semibold text-balance">Um cantinho verde pra chamar de seu</h1>
      <p className="mx-auto mt-4 max-w-xl text-ink-soft">
        Ateliê de plantas no Santo Cristo, Rio de Janeiro. Vasos, mudas e atendimento direto pelo WhatsApp.
      </p>
      <Link
        href={getWhatsAppUrl('Oi! Gostaria de saber mais sobre a Da Verdinha 🌱')}
        target="_blank"
        className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'mt-8 bg-moss hover:bg-moss/90')}
      >
        Falar no WhatsApp
      </Link>
    </section>
  );
}
