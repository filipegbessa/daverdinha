import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversaDetailPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

/** The paginated envelope `GET /categories` returns. */
const categoryList = (items: unknown[]) => ({
  items,
  page: 1,
  perPage: 100,
  total: items.length,
  totalPages: 1,
});
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));

const conversation = {
  id: 'c1',
  phone: '5521999999999',
  name: 'Maria',
  status: 'paused_human' as const,
  entryPoint: 'menu' as const,
  updatedAt: '2026-08-31T14:32:00Z',
  categories: [] as { id: string; name: string; color: string }[],
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'PATCH') return Promise.resolve({ ...conversation, name: 'Maria Silva' });
      return Promise.resolve(conversation);
    });
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
    expect(apiFetch).toHaveBeenCalledTimes(2);
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/pause') {
        return Promise.resolve({ id: 'c1', status: 'paused_human' });
      }
      return Promise.resolve({ ...conversation, status: 'bot_active' });
    });
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/pause') {
        return new Promise((resolve) => {
          resolvePause = resolve;
        });
      }
      return Promise.resolve({ ...conversation, status: 'bot_active' });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Pausar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Pausar bot' }));

    expect(screen.getByRole('button', { name: 'Pausar bot' })).toBeDisabled();

    resolvePause({ id: 'c1', status: 'paused_human' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pausar bot' })).not.toBeDisabled());
  });

  it('shows an inline error when pausing fails', async () => {
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/pause') {
        return Promise.reject(new Error('Erro ao pausar o bot.'));
      }
      return Promise.resolve({ ...conversation, status: 'bot_active' });
    });
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reply') return Promise.resolve({ id: 'm1' });
      return Promise.resolve(conversation);
    });
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reply') {
        return Promise.reject(new Error('Erro ao enviar resposta.'));
      }
      return Promise.resolve(conversation);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const field = await screen.findByLabelText('Responder');
    await userEvent.type(field, 'Oi');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao enviar resposta.');
  });

  it('reactivates the bot on click', async () => {
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reactivate') {
        return Promise.resolve({ id: 'c1', status: 'bot_active' });
      }
      return Promise.resolve(conversation);
    });
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
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reactivate') {
        return new Promise((resolve) => {
          resolveReactivate = resolve;
        });
      }
      return Promise.resolve(conversation);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Reativar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Reativar bot' }));

    expect(screen.getByRole('button', { name: 'Reativar bot' })).toBeDisabled();

    resolveReactivate({ id: 'c1', status: 'bot_active' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Reativar bot' })).not.toBeDisabled());
  });

  it('shows an inline error when reactivating fails', async () => {
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reactivate') {
        return Promise.reject(new Error('Erro ao reativar o bot.'));
      }
      return Promise.resolve(conversation);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: 'Reativar bot' });
    await userEvent.click(screen.getByRole('button', { name: 'Reativar bot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao reativar o bot.');
  });

  it('keeps showing the conversation when a background poll fails', async () => {
    jest.useFakeTimers();
    let conversationCalls = 0;
    const apiFetch = jest.fn((path: string) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      conversationCalls += 1;
      if (conversationCalls === 1) return Promise.resolve(conversation);
      return Promise.reject(new Error('Erro de rede'));
    });
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
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));

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
      order: {
        id: 'o1',
        catalogId: 'cat1',
        items: [
          {
            id: 'oi1',
            productRetailerId: 'vaso-01',
            productName: 'Vaso de Cerâmica',
            quantity: 2,
            unitPrice: '35.00',
            currency: 'BRL',
          },
        ],
      },
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

  it('renders an image message as a photo, with the caption in the body', async () => {
    const imageMessage = {
      id: 'msg4',
      direction: 'inbound' as const,
      kind: 'image' as const,
      body: 'segue o comprovante',
      createdAt: '2026-08-31T14:32:00Z',
    };
    // Duas chamadas diferentes: a thread e, depois, a URL assinada da imagem.
    const apiFetch = jest.fn((path: string) =>
      path.endsWith('/media')
        ? Promise.resolve({ url: 'https://r2.example/signed' })
        : Promise.resolve({ ...conversation, messages: [imageMessage] }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(bubble).toHaveAttribute('data-message-kind', 'image');
    expect(await screen.findByTestId('message-image')).toHaveAttribute(
      'src',
      'https://r2.example/signed',
    );
    expect(bubble).toHaveTextContent('segue o comprovante');
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

  it('shows a truncated preview of the quoted message when repliedTo is present', async () => {
    const replyMessage = {
      id: 'msg3',
      direction: 'inbound' as const,
      body: 'Sim, confirmo!',
      createdAt: '2026-08-31T14:32:00Z',
      repliedToWamid: 'wamid.abc123',
      repliedTo: {
        id: 'msg2',
        kind: 'text' as const,
        direction: 'outbound' as const,
        body: 'x'.repeat(100),
      },
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [replyMessage] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    const quote = within(bubble).getByTestId('reply-quote');
    expect(quote).toHaveTextContent(`${'x'.repeat(80)}…`);
    expect(bubble).toHaveTextContent('Sim, confirmo!');
  });

  it('shows a generic "replying to an earlier message" banner when repliedToWamid is present but repliedTo could not be resolved', async () => {
    const replyMessage = {
      id: 'msg3',
      direction: 'inbound' as const,
      body: 'Sim, confirmo!',
      createdAt: '2026-08-31T14:32:00Z',
      repliedToWamid: 'wamid.abc123',
      repliedTo: null,
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [replyMessage] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(within(bubble).getByTestId('reply-quote-generic')).toHaveTextContent(
      '↩ Respondendo a uma mensagem anterior',
    );
    expect(within(bubble).queryByTestId('reply-quote')).not.toBeInTheDocument();
  });

  it('shows neither a quote block nor the generic banner for a message without repliedTo/repliedToWamid', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubbles = await screen.findAllByTestId('message-bubble');
    for (const bubble of bubbles) {
      expect(within(bubble).queryByTestId('reply-quote')).not.toBeInTheDocument();
      expect(within(bubble).queryByTestId('reply-quote-generic')).not.toBeInTheDocument();
    }
  });

  it('shows a "responder" button on a bubble whose message has a whatsappMessageId', async () => {
    const messageWithWamid = {
      id: 'msg3',
      direction: 'inbound' as const,
      body: 'Quero comprar um vaso',
      createdAt: '2026-08-31T14:32:00Z',
      whatsappMessageId: 'wamid.xyz789',
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [messageWithWamid] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(within(bubble).getByTestId('reply-to-button')).toBeInTheDocument();
  });

  it('does not show a "responder" button on a bubble whose message has no whatsappMessageId', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubbles = await screen.findAllByTestId('message-bubble');
    for (const bubble of bubbles) {
      expect(within(bubble).queryByTestId('reply-to-button')).not.toBeInTheDocument();
    }
  });

  it('shows a "respondendo a" banner with a truncated preview when "responder" is clicked, and clears it via the X', async () => {
    const messageWithWamid = {
      id: 'msg3',
      direction: 'inbound' as const,
      body: 'x'.repeat(100),
      createdAt: '2026-08-31T14:32:00Z',
      whatsappMessageId: 'wamid.xyz789',
    };
    const apiFetch = jest.fn().mockResolvedValue({ ...conversation, messages: [messageWithWamid] });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bubble = await screen.findByTestId('message-bubble');
    expect(screen.queryByTestId('replying-to-banner')).not.toBeInTheDocument();

    await userEvent.click(within(bubble).getByTestId('reply-to-button'));

    const banner = await screen.findByTestId('replying-to-banner');
    expect(banner).toHaveTextContent(`Respondendo a: ${'x'.repeat(60)}…`);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar resposta citada' }));

    expect(screen.queryByTestId('replying-to-banner')).not.toBeInTheDocument();
  });

  it('sends replyToMessageId in the reply body when a message was picked to reply to, and clears it on success', async () => {
    const messageWithWamid = {
      id: 'msg3',
      direction: 'inbound' as const,
      body: 'Quero comprar um vaso',
      createdAt: '2026-08-31T14:32:00Z',
      whatsappMessageId: 'wamid.xyz789',
    };
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reply') return Promise.resolve({ id: 'm1' });
      return Promise.resolve({ ...conversation, messages: [messageWithWamid] });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const bubble = await screen.findByTestId('message-bubble');
    await userEvent.click(within(bubble).getByTestId('reply-to-button'));
    await screen.findByTestId('replying-to-banner');

    const field = screen.getByLabelText('Responder');
    await userEvent.type(field, 'Já separo pra você!');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/reply', {
        method: 'POST',
        body: JSON.stringify({ text: 'Já separo pra você!', replyToMessageId: 'msg3' }),
      }),
    );
    await waitFor(() => expect(screen.queryByTestId('replying-to-banner')).not.toBeInTheDocument());
  });

  it('sends a reply without replyToMessageId when no message was picked to reply to', async () => {
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList([]));
      if (options?.method === 'POST' && path === '/conversations/c1/reply') return Promise.resolve({ id: 'm1' });
      return Promise.resolve(conversation);
    });
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
  });

  it('renders only attached categories as chips in the header', async () => {
    const allCategories = [
      { id: 'cat1', name: 'Bingo', color: '#185928' },
      { id: 'cat2', name: 'Fechou compra', color: '#7a3247' },
    ];
    const apiFetch = jest.fn((path: string) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList(allCategories));
      return Promise.resolve({ ...conversation, categories: [allCategories[0]] });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bingoChip = await screen.findByRole('button', { name: /Bingo/ });
    expect(bingoChip).toHaveStyle({ backgroundColor: '#185928' });
    expect(screen.queryByRole('button', { name: /Fechou compra/ })).not.toBeInTheDocument();
  });

  it('lists only unattached categories in the "+ Categoria" menu and attaches one on click', async () => {
    const allCategories = [
      { id: 'cat1', name: 'Bingo', color: '#185928' },
      { id: 'cat2', name: 'Fechou compra', color: '#7a3247' },
    ];
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList(allCategories));
      if (options?.method === 'POST' && path === '/conversations/c1/categories/cat2') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ ...conversation, categories: [allCategories[0]] });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    await screen.findByRole('button', { name: /Bingo/ });
    await userEvent.click(screen.getByRole('button', { name: '+ Categoria' }));

    const menu = await screen.findByRole('menu', { name: 'Adicionar categoria' });
    expect(within(menu).queryByRole('menuitem', { name: 'Bingo' })).not.toBeInTheDocument();
    const option = within(menu).getByRole('menuitem', { name: 'Fechou compra' });
    await userEvent.click(option);

    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/categories/cat2', { method: 'POST' });
  });

  it('detaches a category when its header chip is clicked', async () => {
    const allCategories = [{ id: 'cat1', name: 'Bingo', color: '#185928' }];
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList(allCategories));
      if (options?.method === 'DELETE' && path === '/conversations/c1/categories/cat1') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ ...conversation, categories: allCategories });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const chip = await screen.findByRole('button', { name: /Bingo/ });
    await userEvent.click(chip);

    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/categories/cat1', { method: 'DELETE' });
  });

  it('keeps the header chip disabled until the refetch confirms the category is actually gone', async () => {
    const allCategories = [{ id: 'cat1', name: 'Bingo', color: '#185928' }];
    let resolveRefetch!: (value: unknown) => void;
    let conversationFetchCount = 0;
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path.startsWith('/categories')) return Promise.resolve(categoryList(allCategories));
      if (options?.method === 'DELETE') return Promise.resolve(undefined);
      conversationFetchCount += 1;
      if (conversationFetchCount === 1) {
        return Promise.resolve({ ...conversation, categories: allCategories });
      }
      // The refetch triggered after the DELETE resolves: kept pending so the
      // test can assert the chip is still disabled/visible in that gap.
      return new Promise((resolve) => {
        resolveRefetch = resolve;
      });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const chip = await screen.findByRole('button', { name: /Bingo/ });
    await userEvent.click(chip);

    // The DELETE call itself already resolved (it's a plain
    // Promise.resolve above), but the chip must stay disabled and visible
    // until the *refetched* conversation confirms the category is gone.
    await waitFor(() => expect(chip).toBeDisabled());
    expect(screen.getByRole('button', { name: /Bingo/ })).toBeInTheDocument();

    resolveRefetch({ ...conversation, categories: [] });

    await waitFor(() => expect(screen.queryByRole('button', { name: /Bingo/ })).not.toBeInTheDocument());
  });

  describe('enviar imagem', () => {
    const pausedConversation = {
      id: 'c1',
      phone: '5521999999999',
      name: null,
      status: 'paused_human' as const,
      unread: false,
      updatedAt: '2026-08-31T14:00:00Z',
      categories: [],
      messages: [],
      hasMoreMessages: false,
    };

    function pngFile(name = 'foto.png', type = 'image/png', size = 1024) {
      const file = new File(['x'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    }

    function renderPaused() {
      const apiFetch = jest.fn().mockResolvedValue(pausedConversation);
      (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
      render(<ConversaDetailPage />);
      return apiFetch;
    }

    it('posts multipart to reply-image, with the text as the caption', async () => {
      const apiFetch = renderPaused();
      await screen.findByLabelText('Responder');

      await userEvent.upload(screen.getByLabelText(/Anexar imagem/), pngFile());
      await userEvent.type(screen.getByLabelText('Responder'), 'o vaso novo');
      await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith(
          '/conversations/c1/reply-image',
          expect.objectContaining({ method: 'POST' }),
        ),
      );
      const [, init] = apiFetch.mock.calls.find(
        ([path]: [string]) => path === '/conversations/c1/reply-image',
      );
      // Uma mensagem só: a legenda viaja com a imagem, não como reply à parte.
      expect(init.body).toBeInstanceOf(FormData);
      expect(init.body.get('caption')).toBe('o vaso novo');
      expect(init.body.get('file')).toBeInstanceOf(File);
    });

    it('sends the image with no caption at all', async () => {
      const apiFetch = renderPaused();
      await screen.findByLabelText('Responder');

      await userEvent.upload(screen.getByLabelText(/Anexar imagem/), pngFile());
      // Sem digitar nada: a imagem já é a mensagem.
      await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith(
          '/conversations/c1/reply-image',
          expect.anything(),
        ),
      );
    });

    it('still posts plain text when nothing is attached', async () => {
      const apiFetch = renderPaused();
      await screen.findByLabelText('Responder');

      await userEvent.type(screen.getByLabelText('Responder'), 'só texto');
      await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith(
          '/conversations/c1/reply',
          expect.objectContaining({
            // `JSON.stringify` descarta o `undefined`, então a citação some.
            body: JSON.stringify({ text: 'só texto' }),
          }),
        ),
      );
    });

    // Rejeitar no navegador poupa subir 5 MB para ouvir um não — mas quem
    // decide continua sendo o backend.
    it('refuses a type the backend would refuse, without uploading', async () => {
      const apiFetch = renderPaused();
      await screen.findByLabelText('Responder');

      // `applyAccept: false` porque o `accept` do input já barraria o PDF no
      // seletor — e é justamente o caso em que ele não barra (arrastar e
      // soltar, "todos os arquivos") que a checagem em JS cobre.
      await userEvent.upload(
        screen.getByLabelText(/Anexar imagem/),
        pngFile('doc.pdf', 'application/pdf'),
        { applyAccept: false },
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Só JPEG, PNG ou WebP.',
      );
      expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
      expect(apiFetch).not.toHaveBeenCalledWith(
        '/conversations/c1/reply-image',
        expect.anything(),
      );
    });

    it('refuses a file past the size ceiling', async () => {
      renderPaused();
      await screen.findByLabelText('Responder');

      await userEvent.upload(
        screen.getByLabelText(/Anexar imagem/),
        pngFile('grande.png', 'image/png', 6 * 1024 * 1024),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent('5 MB');
    });

    it('lets the operator drop the attachment before sending', async () => {
      renderPaused();
      await screen.findByLabelText('Responder');

      await userEvent.upload(screen.getByLabelText(/Anexar imagem/), pngFile());
      expect(await screen.findByTestId('attachment-preview')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Remover anexo' }));

      expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
    });
  });
});
