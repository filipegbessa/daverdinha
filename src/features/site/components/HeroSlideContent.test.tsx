import { render, screen } from '@testing-library/react';
import { HeroSlideContent } from './HeroSlideContent';
import type { HeroSlide } from '@/features/site/types/hero-slide';

const baseSlide: HeroSlide = {
  id: '1',
  titulo: 'Bingo de Plantas',
  subtitulo: 'Todo sábado',
  detalhes: '16h no ateliê',
  linkType: 'whatsapp',
  whatsappMessage: 'Oi! Vim pelo bingo 🌱',
  linkUrl: null,
  imageUrl: null,
};

describe('HeroSlideContent', () => {
  it('renders the slide headline, subheadline and details', () => {
    render(<HeroSlideContent slide={baseSlide} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bingo de Plantas');
    expect(screen.getByText('Todo sábado')).toBeInTheDocument();
    expect(screen.getByText('16h no ateliê')).toBeInTheDocument();
  });

  it('shows a WhatsApp CTA with the prefilled message when linkType is whatsapp', () => {
    render(<HeroSlideContent slide={baseSlide} />);
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986509259'));
    expect(link).toHaveAttribute('href', expect.stringContaining('Oi%21%20Vim%20pelo%20bingo'));
  });

  it('shows a generic CTA linking to the URL when linkType is url', () => {
    const slide: HeroSlide = { ...baseSlide, linkType: 'url', linkUrl: 'https://example.com/evento' };
    render(<HeroSlideContent slide={slide} />);
    expect(screen.getByRole('link', { name: 'Saiba mais' })).toHaveAttribute('href', 'https://example.com/evento');
  });

  it('renders the real image once imageUrl is set', () => {
    const slide: HeroSlide = { ...baseSlide, imageUrl: '/images/bingo.jpg' };
    render(<HeroSlideContent slide={slide} />);
    expect(screen.getByAltText('Foto — Bingo de Plantas')).toBeInTheDocument();
  });
});
