import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('links to Instagram and WhatsApp', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: '@daverdinha_' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/daverdinha_/',
    );
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
  });

  it('links to the privacy policy page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/politica-de-privacidade',
    );
  });

  it('shows the real CNPJ', () => {
    render(<Footer />);
    expect(screen.getByText(/CNPJ 66\.371\.530\/0001-54/)).toBeInTheDocument();
  });

  // A Meta exige que a razão social apareça no site pra verificar a
  // empresa — sem isso, a verificação de negócio falha.
  it('shows the razão social, for Meta business verification', () => {
    render(<Footer />);
    expect(screen.getByText(/Alana Viana Moreno/)).toBeInTheDocument();
  });
});
