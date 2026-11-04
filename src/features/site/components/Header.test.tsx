import { fireEvent, render, screen, within } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('shows the Daverdinha name next to the logo, linking home', () => {
    render(<Header home="/site" />);
    expect(screen.getByRole('link', { name: 'Daverdinha' })).toHaveAttribute('href', '/site');
  });

  it('navigates to the catalog, the agenda and the home sections', () => {
    render(<Header home="/site" />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Produtos' })).toHaveAttribute('href', '/produtos');
    expect(within(nav).getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/agenda');
    expect(within(nav).getByRole('link', { name: 'Entregas' })).toHaveAttribute('href', '/site#entregas');
  });

  it('links the CTA button to WhatsApp with a prefilled greeting', () => {
    render(<Header home="/" />);
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986509259'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('opens the mobile menu as a drawer', () => {
    render(<Header home="/" />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(within(screen.getByRole('navigation', { name: 'Menu' })).getByRole('link', { name: 'Agenda' })).toBeInTheDocument();
  });
});
