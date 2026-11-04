import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('links to Instagram and WhatsApp', () => {
    render(<Footer home="/" />);
    expect(screen.getByRole('link', { name: '@daverdinha_' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/daverdinha_/',
    );
    expect(screen.getByRole('link', { name: 'WhatsApp (21) 98650-9259' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
  });

  // Nome, endereço e telefone em toda página, iguais ao perfil no Google Maps.
  it('shows the address on every page', () => {
    render(<Footer home="/" />);
    expect(screen.getByText(/R\. Capiberibe, 32, Santo Cristo/)).toBeInTheDocument();
  });

  it('links to the privacy policy page', () => {
    render(<Footer home="/" />);
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/politica-de-privacidade',
    );
  });

  it('shows the real CNPJ', () => {
    render(<Footer home="/" />);
    expect(screen.getByText(/CNPJ 66\.371\.530\/0001-54/)).toBeInTheDocument();
  });

  // A Meta exige que a razão social apareça no site pra verificar a
  // empresa — sem isso, a verificação de negócio falha.
  it('shows the razão social, for Meta business verification', () => {
    render(<Footer home="/" />);
    expect(screen.getByText(/Alana Viana Moreno/)).toBeInTheDocument();
  });
});
