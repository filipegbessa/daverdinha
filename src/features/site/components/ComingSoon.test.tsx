import { render, screen } from '@testing-library/react';
import { ComingSoon } from './ComingSoon';

describe('ComingSoon', () => {
  it('says the site is on its way, as the page h1', () => {
    render(<ComingSoon />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nosso site está chegando');
  });

  it('shows the logo with the business name as its alt text', () => {
    render(<ComingSoon />);
    expect(screen.getByAltText('Daverdinha — Ateliê de Plantas')).toBeInTheDocument();
  });

  it('links to WhatsApp with the same greeting the rest of the site uses', () => {
    render(<ComingSoon />);
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986509259'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links to Instagram', () => {
    render(<ComingSoon />);
    const link = screen.getByRole('link', { name: '@daverdinha_' });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/daverdinha_/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows the real address and the business description', () => {
    render(<ComingSoon />);
    expect(
      screen.getByText('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030'),
    ).toBeInTheDocument();
    expect(screen.getByText(/cantinho verde pra chamar de seu/)).toBeInTheDocument();
  });

  it('keeps the privacy policy reachable and shows the CNPJ', () => {
    render(<ComingSoon />);
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/politica-de-privacidade',
    );
    expect(screen.getByText(/66\.371\.530\/0001-54/)).toBeInTheDocument();
  });

  it('offers no e-mail contact — the business does not have one', () => {
    const { container } = render(<ComingSoon />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
