import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroCarousel } from './HeroCarousel';
import type { HeroSlide } from '@/features/site/types/hero-slide';

function slide(id: string, titulo: string): HeroSlide {
  return {
    id,
    titulo,
    subtitulo: 'Sub',
    detalhes: 'Detalhes',
    linkType: 'whatsapp',
    whatsappMessage: 'Oi!',
    linkUrl: null,
    imageUrl: null,
  };
}

const slides = [slide('1', 'Primeiro destaque'), slide('2', 'Segundo destaque'), slide('3', 'Terceiro destaque')];
const originalMatchMedia = window.matchMedia;

describe('HeroCarousel', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders the first slide and one indicator per slide', () => {
    render(<HeroCarousel slides={slides} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Primeiro destaque');
    expect(screen.getAllByRole('button', { name: /Ver destaque/ })).toHaveLength(3);
  });

  it('clicking an indicator switches to that slide', async () => {
    const user = userEvent.setup();
    render(<HeroCarousel slides={slides} />);

    await user.click(screen.getByRole('button', { name: 'Ver destaque 3 de 3' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terceiro destaque');
  });

  it('auto-advances to the next slide after the rotation interval', () => {
    jest.useFakeTimers();
    render(<HeroCarousel slides={slides} />);

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Segundo destaque');
    jest.useRealTimers();
  });

  it('does not auto-advance when the user prefers reduced motion', () => {
    jest.useFakeTimers();
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    render(<HeroCarousel slides={slides} />);

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Primeiro destaque');
    jest.useRealTimers();
  });
});
