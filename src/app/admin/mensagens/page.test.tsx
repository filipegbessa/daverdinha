import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MensagensPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const settings = {
  welcomeMessage: 'Oi! Bem-vinda(o) à Daverdinha 🌱',
  deliveryPrompt: 'Qual o bairro da entrega?',
  deliveryWaitMessage: 'Aguarde, já te chamamos!',
};

describe('MensagensPage', () => {
  it('loads and displays the current messages', async () => {
    const apiFetch = jest.fn().mockResolvedValue(settings);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);

    expect(await screen.findByDisplayValue('Oi! Bem-vinda(o) à Daverdinha 🌱')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Qual o bairro da entrega?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Aguarde, já te chamamos!')).toBeInTheDocument();
  });

  it('saves the edited welcome message', async () => {
    const apiFetch = jest.fn().mockResolvedValueOnce(settings).mockResolvedValueOnce({ ...settings, welcomeMessage: 'Novo texto' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    const field = await screen.findByLabelText('Mensagem de boas-vindas');
    await userEvent.clear(field);
    await userEvent.type(field, 'Novo texto');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ ...settings, welcomeMessage: 'Novo texto' }),
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Salvo!');
  });

  it('shows an error and stops loading when the initial data fetch fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar as mensagens.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);

    await waitFor(() => expect(screen.getByText('Não foi possível carregar as mensagens.')).toBeInTheDocument());
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('shows an error message when saving fails', async () => {
    const apiFetch = jest.fn().mockResolvedValueOnce(settings).mockRejectedValueOnce(new Error('Erro ao salvar as mensagens.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    await screen.findByDisplayValue('Oi! Bem-vinda(o) à Daverdinha 🌱');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByText('Erro ao salvar as mensagens.')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
