import { render, screen, waitFor } from '@testing-library/react';
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
