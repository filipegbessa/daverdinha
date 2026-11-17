import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderSearch } from './HeaderSearch';

describe('HeaderSearch', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('opens a search field and shows suggestions while typing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'Jiboia em cuia',
          href: '/produtos/mudas/jiboia',
          image: null,
          category: 'Mudas',
          price: 59,
          listPrice: null,
        },
      ],
    });
    render(<HeaderSearch />);

    await userEvent.click(screen.getByRole('link', { name: 'Buscar produtos' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produtos' }), 'jibo');

    expect(await screen.findByRole('link', { name: /Jiboia em cuia/ })).toHaveAttribute(
      'href',
      '/produtos/mudas/jiboia',
    );
    expect(fetchMock).toHaveBeenCalledWith('/busca/sugestoes?q=jibo', expect.anything());
    expect(screen.getByRole('link', { name: 'Ver todos os resultados' })).toHaveAttribute('href', '/busca?q=jibo');
  });

  it('says when nothing matches', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    render(<HeaderSearch />);

    await userEvent.click(screen.getByRole('link', { name: 'Buscar produtos' }));
    await userEvent.type(screen.getByRole('searchbox'), 'xyz');

    await waitFor(() => expect(screen.getByText('Nenhum produto com “xyz”.')).toBeInTheDocument());
  });

  it('does not search with a single letter', async () => {
    render(<HeaderSearch />);

    await userEvent.click(screen.getByRole('link', { name: 'Buscar produtos' }));
    await userEvent.type(screen.getByRole('searchbox'), 'j');
    await new Promise((r) => setTimeout(r, 300));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
