import Link from 'next/link';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { HeroSlide } from '@/features/site/types/hero-slide';

export function HeroSlideContent({ slide }: { slide: HeroSlide }) {
  const isWhatsapp = slide.linkType === 'whatsapp';
  const href = isWhatsapp ? getWhatsAppUrl(slide.whatsappMessage ?? undefined) : (slide.linkUrl ?? '#');
  const ctaLabel = isWhatsapp ? 'Falar no WhatsApp' : 'Saiba mais';
  const CtaIcon = isWhatsapp ? MessageCircle : ExternalLink;

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className="text-center md:text-left">
        <Eyebrow>{slide.subtitulo}</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-balance text-ink md:text-5xl">{slide.titulo}</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft md:mx-0">{slide.detalhes}</p>
        <Link
          href={href}
          target="_blank"
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'mt-8 gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
          )}
        >
          <CtaIcon className="size-4" aria-hidden="true" />
          {ctaLabel}
        </Link>
      </div>
      <ImagePlaceholder
        src={slide.imageUrl ?? undefined}
        alt={`Foto — ${slide.titulo}`}
        className="aspect-[4/3] max-h-[420px] rounded-[2.5rem_1rem_2.5rem_1rem] shadow-card"
      />
    </div>
  );
}
