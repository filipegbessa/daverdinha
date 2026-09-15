import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

// The page fetches both '/conversations' and '/categories' through the same
// `apiFetch`. Pre-existing tests only care about the conversations list, so
// this keeps '/categories' resolving to an empty list instead of resolving
// the conversations array for that path too (which would create bogus
// category filter options and break tests asserting on the row contents).
function mockConversationsApi(conversationsResponse: unknown) {
  return jest.fn((path: string) =>
    path === '/categories' ? Promise.resolve([]) : Promise.resolve(conversationsResponse),
  );
}

const conversations = [
  {
    id: 'c1',
    phone: '5521999999999',
    name: 'Maria',
    status: 'paused_human' as const,
    entryPoint: 'menu' as const,
    unread: true,
    updatedAt: '2026-08-31T14:32:00Z',
    categories: [],
  },
  {
    id: 'c2',
    phone: '5521988888888',
    name: null,
    status: 'bot_active' as const,
    entryPoint: 'catalog' as const,
    unread: false,
    updatedAt: '2026-08-30T10:00:00Z',
    categories: [],
  },
];

describe('ConversasPage', () => {
  it('lists every conversation with name first, formatted phone, status and entry point', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(await screen.findByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('+55 (21) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('Transferida')).toBeInTheDocument();
    expect(screen.getByText('Bot ativo')).toBeInTheDocument();
  });

  it('links the name to its conversation detail page', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    expect(screen.getByRole('link', { name: /Maria/ })).toHaveAttribute('href', '/admin/conversas/c1');
  });

  it('links the formatted phone when the conversation has no name', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    expect(screen.getByRole('link', { name: /\+55 \(21\) 98888-8888/ })).toHaveAttribute(
      'href',
      '/admin/conversas/c2',
    );
  });

  it('shows an unread indicator only for unread conversations', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByTitle('Não lida')).toBeInTheDocument();
    expect(within(rows[2]).queryByTitle('Não lida')).not.toBeInTheDocument();
  });

  it('filtering by "Não lidas" shows only unread conversations', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.queryByText('+55 (21) 98888-8888')).not.toBeInTheDocument();
  });

  it('searching by name filters the list', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    await userEvent.type(screen.getByLabelText('Buscar conversas'), 'mari');

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.queryByText('+55 (21) 98888-8888')).not.toBeInTheDocument();
  });

  it('searching by phone digits filters the list', async () => {
    const apiFetch = mockConversationsApi(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');

    await userEvent.type(screen.getByLabelText('Buscar conversas'), '988888888');

    expect(screen.queryByText('Maria')).not.toBeInTheDocument();
    expect(screen.getAllByText('+55 (21) 98888-8888').length).toBeGreaterThan(0);
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: (value: typeof conversations) => void = () => {};
    const apiFetch = jest.fn((path: string) => {
      if (path === '/categories') return Promise.resolve([]);
      return new Promise<typeof conversations>((resolve) => {
        resolveFetch = resolve;
      });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    resolveFetch(conversations);
    await screen.findByText('Maria');
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 500'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(await screen.findByText('Erro 500')).toBeInTheDocument();
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('shows a colored dot per attached category in a new column', async () => {
    const apiFetch = jest.fn((path: string) => {
      if (path === '/categories') return Promise.resolve([{ id: 'cat1', name: 'Bingo', color: '#185928' }]);
      return Promise.resolve([
        {
          id: '1',
          phone: '5521999999999',
          name: 'Maria',
          status: 'bot_active' as const,
          entryPoint: 'menu' as const,
          unread: false,
          updatedAt: '2026-01-01T00:00:00Z',
          categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }],
        },
      ]);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(await screen.findByTitle('Bingo')).toHaveStyle({ backgroundColor: '#185928' });
  });

  it('filters the list down to conversations with the selected category', async () => {
    const apiFetch = jest.fn((path: string) => {
      if (path === '/categories') return Promise.resolve([{ id: 'cat1', name: 'Bingo', color: '#185928' }]);
      return Promise.resolve([
        {
          id: '1',
          phone: '5521999999999',
          name: 'Maria',
          status: 'bot_active' as const,
          entryPoint: 'menu' as const,
          unread: false,
          updatedAt: '2026-01-01T00:00:00Z',
          categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }],
        },
        {
          id: '2',
          phone: '5521988888888',
          name: 'João',
          status: 'bot_active' as const,
          entryPoint: 'menu' as const,
          unread: false,
          updatedAt: '2026-01-01T00:00:00Z',
          categories: [],
        },
      ]);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('Maria');
    expect(screen.getByText('João')).toBeInTheDocument();

    await userEvent.selectOptions(await screen.findByLabelText('Filtrar por categoria'), 'cat1');

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.queryByText('João')).not.toBeInTheDocument();
  });

  it('renders without crashing when a conversation is missing the categories field', async () => {
    const conversationWithoutCategories = {
      id: 'c1',
      phone: '5521999999999',
      name: 'Maria',
      status: 'bot_active' as const,
      entryPoint: 'menu' as const,
      unread: false,
      updatedAt: '2026-01-01T00:00:00Z',
      // categories field is intentionally missing
    } as unknown as typeof conversations[0];

    const apiFetch = mockConversationsApi([conversationWithoutCategories]);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    // The page should render the conversation row without crashing
    expect(await screen.findByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('+55 (21) 99999-9999')).toBeInTheDocument();
  });
});
