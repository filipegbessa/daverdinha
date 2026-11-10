import { render, screen } from '@testing-library/react';
import { SiteButton, siteButtonClass } from './SiteButton';

describe('SiteButton', () => {
  it('renders a button by default, in the brand green', () => {
    render(<SiteButton>Verificar</SiteButton>);
    const button = screen.getByRole('button', { name: 'Verificar' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-moss');
  });

  it('renders a link when it gets an href', () => {
    render(
      <SiteButton href="/produtos" variant="secondary">
        Ver produtos
      </SiteButton>,
    );
    const link = screen.getByRole('link', { name: 'Ver produtos' });
    expect(link).toHaveAttribute('href', '/produtos');
    expect(link).toHaveClass('border-moss-line');
  });

  it('locks itself and says what is happening while loading', () => {
    render(
      <SiteButton loading loadingText="Verificando...">
        Verificar
      </SiteButton>,
    );
    const button = screen.getByRole('button', { name: 'Verificando...' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('lets the caller override layout classes', () => {
    expect(siteButtonClass({ size: 'sm', className: 'hidden sm:inline-flex' })).toMatch(/(^| )hidden( |$)/);
    expect(siteButtonClass({ className: 'hidden' })).not.toMatch(/(^| )inline-flex( |$)/);
  });
});
