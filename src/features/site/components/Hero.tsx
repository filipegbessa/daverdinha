import { HeroSlideView } from '@/features/site/components/HeroSlideView';
import { HeroSlideshow } from '@/features/site/components/HeroSlideshow';
import type { HeroSlide } from '@/features/site/types/hero-slide';

/**
 * O topo da home. Com um slide só (o caso de hoje, sem slides cadastrados) é
 * uma seção estática, sem setas nem troca automática. Com dois ou mais, vira
 * slideshow.
 */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  if (slides.length > 1) return <HeroSlideshow slides={slides} />;

  return (
    <section className="px-6 py-10 md:py-20">
      <HeroSlideView slide={slides[0]} isFirst />
    </section>
  );
}
