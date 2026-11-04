import { act, fireEvent, render, screen } from '@testing-library/react';
import { Hero } from './Hero';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';
import { SAMPLE_HERO_SLIDES } from '@/features/site/data/samples';

describe('Hero', () => {
  afterEach(() => jest.useRealTimers());

  describe('with a single slide', () => {
    // O H1 é o sinal mais forte da página pro Google: diz o que a Daverdinha
    // é e onde fica.
    it('is a static section whose H1 says what the business is and where', () => {
      render(<Hero slides={[DEFAULT_HERO_SLIDE]} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Ateliê de plantas, vasos e oficinas no Rio de Janeiro',
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('leads to the catalog and to WhatsApp', () => {
      render(<Hero slides={[DEFAULT_HERO_SLIDE]} />);

      expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos');
      expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
        'href',
        expect.stringContaining('https://wa.me/5521986509259'),
      );
    });
  });

  describe('with more than one slide', () => {
    it('becomes a slideshow, keeping a single H1 on the first slide', () => {
      render(<Hero slides={SAMPLE_HERO_SLIDES} />);

      expect(screen.getAllByRole('heading', { level: 1, hidden: true })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(DEFAULT_HERO_SLIDE.title);
      expect(screen.getByRole('button', { name: 'Próximo slide' })).toBeInTheDocument();
    });

    it('moves to the next slide on click, hiding the others from assistive tech', () => {
      render(<Hero slides={SAMPLE_HERO_SLIDES} />);

      fireEvent.click(screen.getByRole('button', { name: 'Próximo slide' }));

      expect(screen.getByRole('heading', { name: 'Monte seu terrário com a gente' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ver agenda' })).toHaveAttribute('href', '/agenda');
    });

    it('rotates on its own and stops when paused', () => {
      jest.useFakeTimers();
      render(<Hero slides={SAMPLE_HERO_SLIDES} />);

      act(() => jest.advanceTimersByTime(7000));
      expect(screen.getByRole('heading', { name: 'Monte seu terrário com a gente' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Pausar a troca de slides' }));
      act(() => jest.advanceTimersByTime(21000));
      expect(screen.getByRole('heading', { name: 'Monte seu terrário com a gente' })).toBeInTheDocument();
    });
  });
});
