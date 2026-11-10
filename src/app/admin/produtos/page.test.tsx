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
    stock: 4,
    leadTimeDays: null,
    availability: 'in_stock',
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
    stock: null,
    leadTimeDays: 7,
    availability: 'made_to_order',
  },
  {
    id: 'p3',
    name: 'Vaso G',
    slug: 'vaso-g',
    description: 'Cerâmica.',
    price: 129,
    images: ['https://blob/3.jpg'],
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
    active: true,
    featured: false,
    order: 2,
    stock: 0,
    leadTimeDays: null,
    availability: 'sold_out',
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

  it('says how each product is for sale: stock, sold out or made to order', async () => {
    mockApi();

    render(<ProdutosPage />);

    expect(await screen.findByText(/R\$ 89,90 · Estoque: 4/)).toBeInTheDocument();
    expect(screen.getByText(/sem foto · Sob encomenda · 7 dias/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 129,00 · Esgotado/)).toBeInTheDocument();
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

  it('removes after confirmation, saying the record is kept for old orders', async () => {
    const apiFetch = mockApi();

    render(<ProdutosPage />);
    const [removeFirst] = await screen.findAllByRole('button', { name: 'Remover' });
    await userEvent.click(removeFirst);
    expect(screen.getByText(/O cadastro fica guardado para os pedidos antigos/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remover produto' }));

    expect(apiFetch).toHaveBeenCalledWith('/products/p1', { method: 'DELETE' });
  });

  it('sends search and filters to the API and says when nothing matches', async () => {
    const apiFetch = mockApi((path) => (path.startsWith('/products?') ? page([]) : undefined));

    render(<ProdutosPage />);
    await screen.findByText('Vaso M');

    await userEvent.type(screen.getByLabelText('Buscar produtos'), 'vaso');
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'cat1');
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por situação'), 'false');
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por destaque'), 'true');

    await waitFor(() =>
      expect(apiFetch).toHaveBeenLastCalledWith('/products?q=vaso&categoryId=cat1&active=false&featured=true'),
    );
    expect(await screen.findByText('Nenhum produto encontrado com esses filtros.')).toBeInTheDocument();
  });
});
