import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { businessInfo } from '@/data/business';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

/**
 * Hero fixo, sem carrossel. O H1 é o sinal mais forte da página pro Google e
 * precisa dizer sempre o que a Daverdinha é e onde fica — antes ele era o
 * título do slide da vez e mudava a cada 7 segundos. A novidade da semana
 * agora tem lugar na faixa de eventos, acima do cabeçalho.
 */
export function Hero() {
  return (
    <section className="px-6 py-14 md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="text-center md:text-left">
          <Eyebrow>
            {businessInfo.address.neighborhood} · {businessInfo.address.city}
          </Eyebrow>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-balance text-ink md:text-5xl">
            Ateliê de plantas, vasos e oficinas no Rio de Janeiro
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft md:mx-0">
            Mudas, vasos e arranjos feitos no ateliê, com entrega em bairros do Rio. Pedido direto pelo WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              href={PRODUCTS_HREF}
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
              )}
            >
              Ver produtos
            </Link>
            <ContactLink
              href={getWhatsAppUrl('Oi! Gostaria de saber mais sobre a Daverdinha 🌱')}
              channel="whatsapp"
              location="hero"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'gap-2 rounded-full border-moss text-moss hover:bg-moss/10',
              )}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Falar no WhatsApp
            </ContactLink>
          </div>
        </div>
        <ImagePlaceholder
          alt="O ateliê da Daverdinha no Santo Cristo"
          priority
          className="aspect-4/3 max-h-105 rounded-[2.5rem_1rem_2.5rem_1rem] shadow-card"
        />
      </div>
    </section>
  );
}
