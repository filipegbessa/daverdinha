import { MessageCircle } from 'lucide-react';
import { SiteButton, siteButtonClass } from '@/features/site/components/SiteButton';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { HeroSlide } from '@/features/site/types/hero-slide';

/** Link pra fora do site abre em outra aba; caminho do site navega normal. */
function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * Um slide do topo. O primeiro da lista usa H1 (o título principal da página
 * pro Google); os outros, H2 — uma página tem um H1 só. Cada botão só aparece
 * com o que precisa: o principal com texto e link, o do WhatsApp com a
 * mensagem.
 */
export function HeroSlideView({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  const Heading = isFirst ? 'h1' : 'h2';
  const link = slide.linkLabel && slide.linkUrl ? { label: slide.linkLabel, url: slide.linkUrl } : null;

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-16">
      <div className="text-center md:text-left">
        {slide.eyebrow && <Eyebrow className="mb-3">{slide.eyebrow}</Eyebrow>}
        <Heading className="font-serif text-3xl font-semibold text-balance text-ink sm:text-4xl md:text-5xl">
          {slide.title}
        </Heading>
        {slide.description && (
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-soft sm:text-lg md:mx-0">{slide.description}</p>
        )}
        {(link || slide.whatsappMessage) && (
          <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
            {link &&
              (isExternal(link.url) ? (
                <a href={link.url} target="_blank" rel="noreferrer" className={siteButtonClass({ size: 'sm' })}>
                  {link.label}
                </a>
              ) : (
                <SiteButton href={link.url} size="sm">
                  {link.label}
                </SiteButton>
              ))}
            {slide.whatsappMessage && (
              <ContactLink
                href={getWhatsAppUrl(slide.whatsappMessage)}
                channel="whatsapp"
                location="hero"
                className={siteButtonClass({ variant: link ? 'secondary' : 'primary', size: 'sm' })}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {slide.whatsappLabel ?? 'Falar no WhatsApp'}
              </ContactLink>
            )}
          </div>
        )}
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
