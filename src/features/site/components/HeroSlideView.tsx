import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { HeroSlide } from '@/features/site/types/hero-slide';

/**
 * Um slide do topo. O primeiro da lista usa H1 (o título principal da página
 * pro Google); os outros, H2 — uma página tem um H1 só.
 */
export function HeroSlideView({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  const Heading = isFirst ? 'h1' : 'h2';

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-16">
      <div className="text-center md:text-left">
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Heading className="mt-3 font-serif text-3xl font-semibold text-balance text-ink sm:text-4xl md:text-5xl">
          {slide.title}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-soft sm:text-lg md:mx-0">{slide.description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
          <Link
            href={slide.linkUrl ?? PRODUCTS_HREF}
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
            )}
          >
            {slide.linkLabel ?? 'Ver produtos'}
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
        src={slide.imageUrl ?? undefined}
        alt={slide.title}
        priority={isFirst}
        className="aspect-4/3 max-h-105 rounded-[2.5rem_1rem_2.5rem_1rem] shadow-card"
      />
    </div>
  );
}
