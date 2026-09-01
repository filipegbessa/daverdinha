import type { HeroSlide } from '@/features/site/types/hero-slide';

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  try {
    const response = await fetch(`${apiUrl}/hero-slides/active`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
