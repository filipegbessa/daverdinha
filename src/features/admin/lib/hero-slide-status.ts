import { formatDateTime } from '@/lib/format';
import type { HeroSlideAdmin } from '@/features/admin/types/admin';

/**
 * O que a lista diz de cada destaque: se está na home agora e, se não está,
 * por quê (desligado, ainda vai começar, já terminou).
 */
export function heroSlideStatus(
  slide: Pick<HeroSlideAdmin, 'active' | 'live' | 'startsAt' | 'endsAt'>,
  now: Date = new Date(),
): string {
  if (!slide.active) return 'Desligado';
  if (slide.startsAt && new Date(slide.startsAt) > now) return `Começa em ${formatDateTime(slide.startsAt)}`;
  if (slide.endsAt && new Date(slide.endsAt) <= now) return `Terminou em ${formatDateTime(slide.endsAt)}`;
  return slide.endsAt ? `Na home até ${formatDateTime(slide.endsAt)}` : 'Na home';
}
