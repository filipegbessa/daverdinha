import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';
import * as heroSlidesLib from '@/features/site/lib/hero-slides';
import type { HeroSlide } from '@/features/site/types/hero-slide';

jest.mock('@/features/site/lib/hero-slides');

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

describe('Hero', () => {
  it('falls back to the default content when there are no active slides (e.g. backend not configured yet)', async () => {
    (heroSlidesLib.getActiveHeroSlides as jest.Mock).mockResolvedValue([]);

    const jsx = await Hero();
    render(jsx);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(
      screen.getByText('Ateliê de plantas no Santo Cristo, Rio de Janeiro. Vasos, mudas e atendimento direto pelo WhatsApp.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
    expect(screen.queryByRole('button', { name: /Ver destaque/ })).not.toBeInTheDocument();
  });

  it('renders a single slide statically, with no carousel controls, when exactly one is active', async () => {
    (heroSlidesLib.getActiveHeroSlides as jest.Mock).mockResolvedValue([slide('1', 'Só um Destaque')]);

    const jsx = await Hero();
    render(jsx);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Só um Destaque');
    expect(screen.queryByRole('button', { name: /Ver destaque/ })).not.toBeInTheDocument();
  });

  it('renders a carousel with indicators when two or more slides are active', async () => {
    (heroSlidesLib.getActiveHeroSlides as jest.Mock).mockResolvedValue([
      slide('1', 'Primeiro'),
      slide('2', 'Segundo'),
    ]);

    const jsx = await Hero();
    render(jsx);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Primeiro');
    expect(screen.getAllByRole('button', { name: /Ver destaque/ })).toHaveLength(2);
  });
});
