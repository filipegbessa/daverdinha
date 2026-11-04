import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  // O H1 é o sinal mais forte da página pro Google: fixo, com o que a
  // Daverdinha é e onde fica. Não pode depender de slide nem de API.
  it('has a fixed H1 saying what the business is and where', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ateliê de plantas, vasos e oficinas no Rio de Janeiro',
    );
  });

  it('leads to the catalog and to WhatsApp', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos');
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
  });
});
