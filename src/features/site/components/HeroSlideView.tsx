import { MessageCircle } from 'lucide-react';
import { SiteButton, siteButtonClass } from '@/features/site/components/SiteButton';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { HeroSlide } from '@/features/site/types/hero-slide';
import { HERO_MESSAGE } from '@/features/site/lib/whatsapp-messages';

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
          <SiteButton href={slide.linkUrl ?? PRODUCTS_HREF} size="sm">
            {slide.linkLabel ?? 'Ver produtos'}
          </SiteButton>
          <ContactLink
            href={getWhatsAppUrl(HERO_MESSAGE)}
            channel="whatsapp"
            location="hero"
            className={siteButtonClass({ variant: 'secondary', size: 'sm' })}
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
