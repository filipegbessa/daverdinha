import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const emptySettings = { botEnabled: false, welcomeMessage: '', deliveryPrompt: '', deliveryWaitMessage: '' };

describe('DashboardPage', () => {
  it('shows the warning banner and disables the toggle when there are no active menu items', async () => {
    const apiFetch = jest.fn().mockResolvedValueOnce(emptySettings).mockResolvedValueOnce([{ id: '1', active: false }]);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  it('lets the operator toggle the bot on when at least one menu item is active', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(emptySettings)
      .mockResolvedValueOnce([{ id: '1', active: true }])
      .mockResolvedValueOnce({ ...emptySettings, botEnabled: true });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

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
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(emptySettings)
      .mockResolvedValueOnce([{ id: '1', active: true }])
      .mockRejectedValueOnce(new Error('Não é possível ligar o bot sem nenhum item de menu ativo.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

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
