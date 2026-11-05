import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProdutosPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const categories = [
  { id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0, _count: { products: 2 } },
];

const products = [
  {
    id: 'p1',
    name: 'Vaso M',
    slug: 'vaso-m',
    description: 'Cerâmica.',
    price: 89.9,
    images: ['https://blob/1.jpg'],
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
    active: true,
    featured: true,
    order: 0,
  },
  {
    id: 'p2',
    name: 'Vaso P',
    slug: 'vaso-p',
    description: 'Cerâmica.',
    price: 49,
    images: [],
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
    active: false,
    featured: false,
    order: 1,
  },
];

const page = (items: unknown[]) => ({ items, page: 1, perPage: 20, total: items.length, totalPages: 1 });

/** Responde por rota, já que a página busca produtos e categorias em paralelo. */
function mockApi(overrides: (path: string, init?: RequestInit) => unknown = () => undefined) {
  const apiFetch = jest.fn(async (path: string, init?: RequestInit) => {
    const override = overrides(path, init);
    if (override !== undefined) return override;
    if (path.startsWith('/product-categories')) return categories;
    if (path.startsWith('/products') && !init) return page(products);
    return undefined;
  });
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

describe('ProdutosPage', () => {
  it('lists products with category, price, featured badge and a missing-photo note', async () => {
    mockApi();

    render(<ProdutosPage />);

    expect(await screen.findByText('Vaso M')).toBeInTheDocument();
    expect(screen.getByText('Destaque')).toBeInTheDocument();
    expect(screen.getByText(/Vasos · R\$ 89,90/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 49,00 · sem foto/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Mostrar Vaso P no site' })).not.toBeChecked();
  });

  it('toggles "active" with a multipart PATCH carrying only that field', async () => {
    const apiFetch = mockApi();

    render(<ProdutosPage />);
    await userEvent.click(await screen.findByRole('switch', { name: 'Mostrar Vaso P no site' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/products/p2', { method: 'PATCH', body: expect.any(FormData) }),
    );
    const body = apiFetch.mock.calls.find(([path]) => path === '/products/p2')![1]!.body as FormData;
    expect(Object.fromEntries(body.entries())).toEqual({ active: 'true' });
  });

  it('opens the create dialog with the categories loaded', async () => {
    mockApi();

    render(<ProdutosPage />);
    await screen.findByText('Vaso M');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Novo produto' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Novo produto' }));

    expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vasos' })).toBeInTheDocument();
  });

  it('deletes after confirmation', async () => {
    const apiFetch = mockApi();

    render(<ProdutosPage />);
    const [deleteFirst] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteFirst);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(apiFetch).toHaveBeenCalledWith('/products/p1', { method: 'DELETE' });
  });
});
