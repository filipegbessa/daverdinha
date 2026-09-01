import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('shows the real headline and subheadline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(
      screen.getByText('Ateliê de plantas no Santo Cristo, Rio de Janeiro. Vasos, mudas e atendimento direto pelo WhatsApp.'),
    ).toBeInTheDocument();
  });

  it('has a CTA linking to WhatsApp', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
  });
});
