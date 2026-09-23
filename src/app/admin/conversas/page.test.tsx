import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

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

/**
 * Routes by path prefix. The page reads '/conversations' (now with a query
 * string carrying the filters) and '/categories' through the same apiFetch.
 */
function mockApi(
  options: { items?: unknown[]; total?: number; totalPages?: number; categories?: unknown[] } = {},
) {
  const apiFetch = jest.fn((path: string) => {
    if (path.startsWith('/categories')) {
      const items = options.categories ?? [];
      return Promise.resolve({ items, page: 1, perPage: 100, total: items.length, totalPages: 1 });
    }
    const items = options.items ?? conversations;
    return Promise.resolve({
      items,
      page: Number(new URLSearchParams(path.split('?')[1] ?? '').get('page') ?? 1),
      perPage: 20,
      total: options.total ?? items.length,
      totalPages: options.totalPages ?? 1,
      unreadTotal: 1,
    });
  });
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

/** The '/conversations...' paths requested so far, in order. */
const conversationCalls = (apiFetch: jest.Mock) =>
  apiFetch.mock.calls.map(([path]) => path as string).filter((path) => path.startsWith('/conversations'));

/**
 * The desktop table and the mobile card list both render every conversation
 * at once (only CSS hides one of them, and jsdom doesn't apply that) — so
 * any assertion on row content has to scope to one of them, or it'll trip
 * over "found multiple elements". The desktop table is the one with the
 * sortable headers under test, so it's the one most of this file scopes to.
 */
const table = () => screen.getByRole('table');

describe('ConversasPage', () => {
  it('lists every conversation with name first, formatted phone, status and entry point', async () => {
    mockApi();

    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    expect(within(table()).getByText('Maria')).toBeInTheDocument();
    expect(within(table()).getByText('+55 (21) 99999-9999')).toBeInTheDocument();
    expect(within(table()).getByText('Transferida')).toBeInTheDocument();
    expect(within(table()).getByText('Bot ativo')).toBeInTheDocument();
  });

  it('links the name to its conversation detail page', async () => {
    mockApi();

    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    expect(within(table()).getByRole('link', { name: /Maria/ })).toHaveAttribute('href', '/admin/conversas/c1');
  });

  it('links the formatted phone when the conversation has no name', async () => {
    mockApi();

    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    expect(within(table()).getByRole('link', { name: /\+55 \(21\) 98888-8888/ })).toHaveAttribute(
      'href',
      '/admin/conversas/c2',
    );
  });

  it('shows an unread indicator only for unread conversations', async () => {
    mockApi();

    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    expect(within(table()).getAllByTitle('Não lida')).toHaveLength(1);
  });

  it('shows a loading state while the request is in flight', () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn(() => new Promise(() => {})) });

    render(<ConversasPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
  });

  it('shows a colored dot per attached category', async () => {
    mockApi({
      items: [{ ...conversations[0], categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] }],
      categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }],
    });

    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    expect(within(table()).getByTitle('Bingo')).toHaveStyle({ backgroundColor: '#185928' });
  });

  it('renders without crashing when a conversation is missing the categories field', async () => {
    const { categories: _omitted, ...withoutCategories } = conversations[0];
    mockApi({ items: [withoutCategories] });

    render(<ConversasPage />);

    expect((await screen.findAllByText('Maria'))[0]).toBeInTheDocument();
  });

  describe('filtering happens on the server, not in the browser', () => {
    it('asks the API for unread only when the filter is on', async () => {
      const apiFetch = mockApi();

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));

      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?unread=true'));
    });

    it('sends the search term as a query param once typing settles', async () => {
      const apiFetch = mockApi();

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.type(screen.getByLabelText('Buscar conversas'), 'maria');

      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?q=maria'));
    });

    it('does not fire a request per keystroke', async () => {
      const apiFetch = mockApi();

      render(<ConversasPage />);
      await screen.findAllByText('Maria');
      const before = conversationCalls(apiFetch).length;

      await userEvent.type(screen.getByLabelText('Buscar conversas'), 'maria');
      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?q=maria'));

      // One settled request, not one per character.
      expect(conversationCalls(apiFetch).length - before).toBeLessThan(5);
    });

    it('sends the selected category as a query param', async () => {
      const apiFetch = mockApi({ categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'cat1');

      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?categoryId=cat1'));
    });

    it('combines every active filter into one request', async () => {
      const apiFetch = mockApi({ categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));
      await userEvent.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'cat1');
      await userEvent.type(screen.getByLabelText('Buscar conversas'), 'maria');

      await waitFor(() =>
        expect(conversationCalls(apiFetch)).toContain('/conversations?q=maria&unread=true&categoryId=cat1'),
      );
    });
  });

  describe('pagination', () => {
    it('shows the position and the total', async () => {
      mockApi({ total: 137, totalPages: 7 });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      expect(screen.getByText('Página 1 de 7')).toBeInTheDocument();
      expect(screen.getByText('137 conversas')).toBeInTheDocument();
    });

    it('asks the API for the next page', async () => {
      const apiFetch = mockApi({ total: 137, totalPages: 7 });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?page=2'));
    });

    it('goes back to page 1 when a filter changes, so the operator does not land on an empty page', async () => {
      const apiFetch = mockApi({ total: 137, totalPages: 7 });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');
      await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?page=2'));

      await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));

      await waitFor(() => expect(conversationCalls(apiFetch)).toContain('/conversations?unread=true'));
    });

    it('hides the control when everything fits on one page', async () => {
      mockApi({ total: 2, totalPages: 1 });

      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument();
    });
  });

  it('says so plainly when a filter matches nothing', async () => {
    mockApi({ items: [] });

    render(<ConversasPage />);

    expect(await screen.findByText('Nenhuma conversa encontrada.')).toBeInTheDocument();
  });

  it('renders the row cells in the expected column order', async () => {
    mockApi();
    render(<ConversasPage />);
    await screen.findAllByText('Maria');

    const row = within(table()).getByRole('link', { name: /Maria/ }).closest('tr')!;
    const cells = within(row).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('+55 (21) 99999-9999');
    expect(cells[2]).toHaveTextContent('Transferida');
    expect(cells[3]).toHaveTextContent('Menu');
  });

  describe('column sorting (desktop only)', () => {
    it('sorts by name ascending on first click of the Nome header, and descending on the second', async () => {
      mockApi();
      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      const nameOrder = () =>
        within(table())
          .getAllByRole('row')
          .slice(1)
          .map((row) => within(row).getAllByRole('cell')[0].textContent);

      await userEvent.click(within(table()).getByRole('button', { name: 'Nome' }));
      // '+55 (21) 98888-8888' (c2's fallback display) sorts before 'Maria'.
      expect(nameOrder()[0]).toContain('98888-8888');

      await userEvent.click(within(table()).getByRole('button', { name: 'Nome' }));
      expect(nameOrder()[0]).toContain('Maria');
    });

    it('defaults "Atualizado em" to descending (most recent first) on first click', async () => {
      mockApi();
      render(<ConversasPage />);
      await screen.findAllByText('Maria');

      await userEvent.click(within(table()).getByRole('button', { name: 'Atualizado em' }));

      expect(within(table()).getByRole('columnheader', { name: 'Atualizado em' })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
    });
  });
});
