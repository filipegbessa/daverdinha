import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversaDetailPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));

const conversation = {
  id: 'c1',
  phone: '5521999999999',
  name: 'Maria',
  status: 'paused_human' as const,
  entryPoint: 'menu' as const,
  updatedAt: '2026-08-31T14:32:00Z',
  messages: [
    { id: 'msg1', direction: 'inbound' as const, body: 'Oi, boa tarde!', createdAt: '2026-08-31T14:31:00Z' },
    { id: 'msg2', direction: 'outbound' as const, body: 'Oi! Como posso ajudar?', createdAt: '2026-08-31T14:31:05Z' },
  ],
};

const unnamedConversation = { ...conversation, name: null };

describe('ConversaDetailPage', () => {
  it('shows the contact name as the heading, the formatted phone as a subtitle, and every message in order', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByRole('heading', { name: 'Maria' })).toBeInTheDocument();
    expect(screen.getByText('+55 (21) 99999-9999')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1');

    const messages = screen.getAllByTestId('message-bubble');
    expect(messages[0]).toHaveTextContent('Oi, boa tarde!');
    expect(messages[1]).toHaveTextContent('Oi! Como posso ajudar?');
  });

  it('shows the formatted phone as the heading when the conversation has no name', async () => {
    const apiFetch = jest.fn().mockResolvedValue(unnamedConversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByRole('heading', { name: '+55 (21) 99999-9999' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ adicionar nome' })).toBeInTheDocument();
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: (value: typeof conversation) => void = () => {};
    const apiFetch = jest.fn().mockReturnValue(
      new Promise<typeof conversation>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    resolveFetch(conversation);
    await screen.findByRole('heading', { name: 'Maria' });
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 404'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByText('Erro 404')).toBeInTheDocument();
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('lets the operator open the name editor, edit and save the contact name', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockResolvedValueOnce({ ...conversation, name: 'Maria Silva' })
      .mockResolvedValueOnce({ ...conversation, name: 'Maria Silva' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('heading', { name: 'Maria' });

    await userEvent.click(screen.getByRole('button', { name: 'editar nome' }));
    const field = screen.getByLabelText('Nome');
    expect(field).toHaveValue('Maria');
    await userEvent.clear(field);
    await userEvent.type(field, 'Maria Silva');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/conversations/c1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Maria Silva' }),
      }),
    );
  });

  it('closes the name editor without saving when Cancelar is clicked', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('heading', { name: 'Maria' });

    await userEvent.click(screen.getByRole('button', { name: 'editar nome' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('shows a Pausar bot button (and no reply form) when the conversation is bot_active', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, status: 'bot_active' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByRole('button', { name: 'Pausar bot' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Responder')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reativar bot' })).not.toBeInTheDocument();
  });

  it('pauses the bot on click', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ ...conversation, status: 'bot_active' })
      .mockResolvedValueOnce({ id: 'c1', status: 'paused_human' })
      .mockResolvedValueOnce({ ...conversation, status: 'paused_human' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Pausar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Pausar bot' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/pause', { method: 'POST' }),
    );
  });

  it('disables the Pausar bot button while the request is in flight', async () => {
    let resolvePause: (value: unknown) => void = () => {};
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ ...conversation, status: 'bot_active' })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePause = resolve;
        }),
      )
      .mockResolvedValueOnce({ ...conversation, status: 'paused_human' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Pausar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Pausar bot' }));

    expect(screen.getByRole('button', { name: 'Pausar bot' })).toBeDisabled();

    resolvePause({ id: 'c1', status: 'paused_human' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pausar bot' })).not.toBeDisabled());
  });

  it('shows an inline error when pausing fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ ...conversation, status: 'bot_active' })
      .mockRejectedValueOnce(new Error('Erro ao pausar o bot.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Pausar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Pausar bot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao pausar o bot.');
  });

  it('shows a reply form and a reactivate button when the conversation is paused_human', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByLabelText('Responder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reativar bot' })).toBeInTheDocument();
  });

  it('does not show the reply form or reactivate button when the conversation is bot_active', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, status: 'bot_active' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    await screen.findByRole('heading', { name: 'Maria' });
    expect(screen.queryByLabelText('Responder')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reativar bot' })).not.toBeInTheDocument();
  });

  it('sends a reply and clears the field on success', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockResolvedValueOnce({ id: 'm1' })
      .mockResolvedValueOnce(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const field = await screen.findByLabelText('Responder');
    await userEvent.type(field, 'Já te chamo!');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/reply', {
        method: 'POST',
        body: JSON.stringify({ text: 'Já te chamo!' }),
      }),
    );
    await waitFor(() => expect(field).toHaveValue(''));
  });

  it('shows an inline error when sending a reply fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockRejectedValueOnce(new Error('Erro ao enviar resposta.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const field = await screen.findByLabelText('Responder');
    await userEvent.type(field, 'Oi');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao enviar resposta.');
  });

  it('reactivates the bot on click', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockResolvedValueOnce({ id: 'c1', status: 'bot_active' })
      .mockResolvedValueOnce({ ...conversation, status: 'bot_active' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Reativar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Reativar bot' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/reactivate', { method: 'POST' }),
    );
  });

  it('disables the Reativar bot button while the request is in flight', async () => {
    let resolveReactivate: (value: unknown) => void = () => {};
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveReactivate = resolve;
        }),
      )
      .mockResolvedValueOnce({ ...conversation, status: 'bot_active' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Reativar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Reativar bot' }));

    expect(screen.getByRole('button', { name: 'Reativar bot' })).toBeDisabled();

    resolveReactivate({ id: 'c1', status: 'bot_active' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Reativar bot' })).not.toBeDisabled());
  });

  it('shows an inline error when reactivating fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockRejectedValueOnce(new Error('Erro ao reativar o bot.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Reativar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Reativar bot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao reativar o bot.');
  });

  it('keeps showing the conversation when a background poll fails', async () => {
    jest.useFakeTimers();
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(conversation)
      .mockRejectedValueOnce(new Error('Erro de rede'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    // Flush the initial fetch's promise resolution inside `act` before
    // advancing fake timers — otherwise the resulting state update lands
    // outside any `act` call and React warns, even though the assertions
    // below already wait for the right thing.
    await act(async () => {});
    await screen.findByRole('heading', { name: 'Maria' });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));

    expect(screen.getByRole('heading', { name: 'Maria' })).toBeInTheDocument();
    expect(screen.getAllByTestId('message-bubble')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'editar nome' })).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('defaults a message with no kind to the normal text layout', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubbles = await screen.findAllByTestId('message-bubble');
    expect(bubbles[0]).toHaveAttribute('data-message-kind', 'text');
  });

  it('renders a catalog-order message with a distinct highlighted layout, listing the structured order items with a formatted price', async () => {
    const orderMessage = {
      id: 'msg3',
      direction: 'inbound' as const,
      kind: 'order' as const,
      body: null,
      orderItems: [
        {
          id: 'oi1',
          catalogId: 'cat1',
          productRetailerId: 'vaso-01',
          productName: 'Vaso de Cerâmica',
          quantity: 2,
          unitPrice: '35.00',
          currency: 'BRL',
        },
      ],
      createdAt: '2026-08-31T14:32:00Z',
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [orderMessage] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(bubble).toHaveAttribute('data-message-kind', 'order');
    expect(bubble).toHaveTextContent('🛒 Pedido pelo catálogo');
    expect(bubble).toHaveTextContent('Vaso de Cerâmica x2');
    expect(bubble).toHaveTextContent('R$ 35,00');
  });

  it('falls back to the raw body for older catalog-order messages without structured order items', async () => {
    const orderMessage = {
      id: 'msg3',
      direction: 'inbound' as const,
      kind: 'order' as const,
      body: 'Pedido pelo catálogo:\n- Produto vaso-01 x2 — BRL 35.00',
      createdAt: '2026-08-31T14:32:00Z',
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [orderMessage] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(bubble).toHaveTextContent('Produto vaso-01');
  });

  it('renders an invalid-content message distinctly from a normal text bubble', async () => {
    const invalidMessage = {
      id: 'msg3',
      direction: 'inbound' as const,
      kind: 'invalid_content' as const,
      body: '[Conteúdo inválido]',
      createdAt: '2026-08-31T14:32:00Z',
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [invalidMessage] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(bubble).toHaveAttribute('data-message-kind', 'invalid_content');
    expect(bubble).toHaveTextContent('[Conteúdo inválido]');
  });
});
