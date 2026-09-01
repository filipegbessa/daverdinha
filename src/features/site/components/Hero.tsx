import { getActiveHeroSlides } from '@/features/site/lib/hero-slides';
import { DEFAULT_HERO_SLIDE } from '@/data/hero-slides';
import { HeroSlideContent } from '@/features/site/components/HeroSlideContent';
import { HeroCarousel } from '@/features/site/components/HeroCarousel';

export async function Hero() {
  const slides = await getActiveHeroSlides();
  const displaySlides = slides.length > 0 ? slides : [DEFAULT_HERO_SLIDE];

  if (displaySlides.length === 1) {
    return (
      <section className="px-6 py-16 md:py-24">
        <HeroSlideContent slide={displaySlides[0]} />
      </section>
    );
  }

  return <HeroCarousel slides={displaySlides} />;
}
