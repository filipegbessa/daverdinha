import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MensagensPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const settings = {
  welcomeMessage: 'Oi! Bem-vinda(o) à Daverdinha 🌱',
  invalidAttemptsExceededMessage: 'Não consegui entender sua opção, vou te chamar um atendente!',
  mediaReceivedMessage: 'Esse tipo de mensagem não é válido por aqui!',
  orderReceivedMessage: 'Aceito! Recebemos seu pedido, já vamos confirmar com você.',
};

describe('MensagensPage', () => {
  it('loads and displays the current messages with their captions', async () => {
    const apiFetch = jest.fn().mockResolvedValue(settings);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);

    expect(await screen.findByDisplayValue(settings.welcomeMessage)).toBeInTheDocument();
    expect(screen.getByDisplayValue(settings.invalidAttemptsExceededMessage)).toBeInTheDocument();
    expect(screen.getByDisplayValue(settings.mediaReceivedMessage)).toBeInTheDocument();
    expect(screen.getByDisplayValue(settings.orderReceivedMessage)).toBeInTheDocument();
    expect(screen.getByText('Enviada assim que a conversa começa.')).toBeInTheDocument();
    expect(
      screen.getByText('Enviada quando o cliente erra a opção do menu 3 vezes seguidas.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enviada quando o cliente manda áudio, figurinha, vídeo ou outro conteúdo que o bot não entende. O bot continua a conversa normalmente depois.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enviada quando o cliente faz um pedido pelo catálogo do WhatsApp, antes de transferir para um atendente.'),
    ).toBeInTheDocument();
  });

  it('saves the edited welcome message', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce({ ...settings, welcomeMessage: 'Novo texto' });
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

  it('saves the edited escalation message', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce({ ...settings, invalidAttemptsExceededMessage: 'Novo texto' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    const field = await screen.findByLabelText('Mensagem de escalonamento');
    await userEvent.clear(field);
    await userEvent.type(field, 'Novo texto');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ ...settings, invalidAttemptsExceededMessage: 'Novo texto' }),
      }),
    );
  });

  it('saves the edited invalid-content message', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce({ ...settings, mediaReceivedMessage: 'Novo texto' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    const field = await screen.findByLabelText('Mensagem de conteúdo inválido');
    await userEvent.clear(field);
    await userEvent.type(field, 'Novo texto');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ ...settings, mediaReceivedMessage: 'Novo texto' }),
      }),
    );
  });

  it('saves the edited catalog-order message', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce({ ...settings, orderReceivedMessage: 'Novo texto' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    const field = await screen.findByLabelText('Mensagem de pedido pelo catálogo');
    await userEvent.clear(field);
    await userEvent.type(field, 'Novo texto');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ ...settings, orderReceivedMessage: 'Novo texto' }),
      }),
    );
  });

  it('shows an error and stops loading when the initial data fetch fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar as mensagens.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);

    await waitFor(() => expect(screen.getByText('Não foi possível carregar as mensagens.')).toBeInTheDocument());
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('shows an error message when saving fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(settings)
      .mockRejectedValueOnce(new Error('Erro ao salvar as mensagens.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MensagensPage />);
    await screen.findByDisplayValue(settings.welcomeMessage);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByText('Erro ao salvar as mensagens.')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
