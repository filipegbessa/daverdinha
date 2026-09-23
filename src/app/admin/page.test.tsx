import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const emptySettings = { botEnabled: false, welcomeMessage: '' };

/**
 * Routes by path instead of by call order: the page reads two resources and
 * re-reads one after a toggle, so an ordered `mockResolvedValueOnce` chain
 * would break on any change to how often the page refetches.
 */
function mockApi(handlers: {
  settings?: () => unknown;
  menuItems?: () => unknown;
  patch?: () => unknown;
}) {
  const apiFetch = jest.fn((path: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') return Promise.resolve(handlers.patch?.());
    if (path === '/menu-items') return Promise.resolve(handlers.menuItems?.() ?? []);
    return Promise.resolve(handlers.settings?.() ?? emptySettings);
  });
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

describe('DashboardPage', () => {
  it('shows the warning banner and disables the toggle when there are no active menu items', async () => {
    mockApi({ menuItems: () => [{ id: '1', active: false }] });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  // Regressão do PWA: no primeiro acesso, /bot-settings respondia antes de
  // /menu-items e a página já renderizava. Como a lista ainda era null, a
  // contagem caía em 0 e o operador era acusado de não ter item de menu
  // nenhum — a mensagem sumia sozinha quando a lista chegava.
  it('does not accuse the shop of having no menu items while the list is still loading', async () => {
    let releaseMenuItems: (items: unknown) => void = () => {};
    const apiFetch = jest.fn((path: string) => {
      if (path === '/menu-items') {
        return new Promise((resolve) => {
          releaseMenuItems = resolve;
        });
      }
      return Promise.resolve(emptySettings);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    // Drena as microtasks pra garantir que /bot-settings já resolveu de fato —
    // sem isso a asserção passaria só porque nada tinha resolvido ainda, que é
    // acidente de timing e não o comportamento em teste.
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/menu-items'));
    await act(async () => {
      await Promise.resolve();
    });

    // Configurações carregadas, lista pendente: a página espera em vez de
    // concluir que não há item nenhum.
    expect(screen.queryByText(/não há nenhum item de menu ativo/)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      releaseMenuItems([{ id: '1', active: true }]);
    });

    await waitFor(() => expect(screen.getByRole('switch')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports a failure to load the menu items instead of claiming there are none', async () => {
    const apiFetch = jest.fn((path: string) => {
      if (path === '/menu-items') return Promise.reject(new Error('API fora do ar'));
      return Promise.resolve(emptySettings);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('API fora do ar');
    // O texto que acusa ausência de item não pode aparecer: não sabemos.
    expect(screen.queryByText(/não há nenhum item de menu ativo/)).not.toBeInTheDocument();
  });

  it('lets the operator toggle the bot on when at least one menu item is active', async () => {
    const apiFetch = mockApi({
      menuItems: () => [{ id: '1', active: true }],
      patch: () => ({ ...emptySettings, botEnabled: true }),
    });

    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('switch')).not.toHaveAttribute('aria-disabled', 'true'));

    await userEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ botEnabled: true }),
      }),
    );
  });

  it('shows the backend error message when the toggle update fails', async () => {
    mockApi({
      menuItems: () => [{ id: '1', active: true }],
      patch: () => {
        throw new Error('Não é possível ligar o bot sem nenhum item de menu ativo.');
      },
    });

    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('switch')).not.toHaveAttribute('aria-disabled', 'true'));
    await userEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(screen.getByText('Não é possível ligar o bot sem nenhum item de menu ativo.')).toBeInTheDocument(),
    );
  });

  it('shows the storage notice once mediaBytesUsed is close to the cap', async () => {
    const GB = 1024 * 1024 * 1024;
    mockApi({
      menuItems: () => [{ id: '1', active: true }],
      settings: () => ({ ...emptySettings, mediaBytesUsed: 7.2 * GB }),
    });

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText(/Armazenamento de imagens: 7\.2 GB de 8\.0 GB/)).toBeInTheDocument(),
    );
  });

  it('does not show the storage notice for a plain settings fixture without mediaBytesUsed', async () => {
    mockApi({ menuItems: () => [{ id: '1', active: true }] });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('switch')).toBeInTheDocument());
    expect(screen.queryByText(/Armazenamento de imagens/)).not.toBeInTheDocument();
  });

  it('shows an error and stops loading when the initial data fetch fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar os dados do painel.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText('Não foi possível carregar os dados do painel.')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
