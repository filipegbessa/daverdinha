import { render, screen } from '@testing-library/react';
import { SiteShell } from './SiteShell';

describe('SiteShell', () => {
  it('shows the store pause on top, with the return day in Rio', () => {
    render(
      <SiteShell
        home="/"
        storeEnabled
        storePause={{ message: 'Estamos de férias!', until: '2027-01-06T03:00:00.000Z' }}
      >
        <p>conteúdo</p>
      </SiteShell>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Estamos de férias! Voltamos a receber pedidos em 6 de janeiro.',
    );
  });

  it('has a default text for a pause without message nor date', () => {
    render(
      <SiteShell home="/" storeEnabled storePause={{ message: null, until: null }}>
        <p>conteúdo</p>
      </SiteShell>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('A loja está em pausa e não está recebendo pedidos agora.');
  });

  it('has no notice without a pause, or with the store off', () => {
    const { rerender } = render(
      <SiteShell home="/" storeEnabled>
        <p>conteúdo</p>
      </SiteShell>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(
      <SiteShell home="/" storeEnabled={false} storePause={{ message: 'x', until: null }}>
        <p>conteúdo</p>
      </SiteShell>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
