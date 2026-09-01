import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

export function Hero() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="text-center md:text-left">
          <Eyebrow>Santo Cristo, Rio de Janeiro</Eyebrow>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-balance text-ink md:text-5xl">
            Um cantinho verde pra chamar de seu
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft md:mx-0">
            Ateliê de plantas no Santo Cristo, Rio de Janeiro. Vasos, mudas e atendimento direto pelo WhatsApp.
          </p>
          <Link
            href={getWhatsAppUrl('Oi! Gostaria de saber mais sobre a Da Verdinha 🌱')}
            target="_blank"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'mt-8 gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
            )}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </Link>
        </div>
        <ImagePlaceholder
          alt="Foto do ateliê Da Verdinha"
          className="aspect-[4/3] max-h-[420px] rounded-[2.5rem_1rem_2.5rem_1rem] shadow-card"
        />
      </div>
    </section>
  );
}
