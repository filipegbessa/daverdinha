import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProdutoPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');
const push = jest.fn();
let search = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'p1' }),
  useRouter: () => ({ push }),
  useSearchParams: () => search,
}));

const categories = [
  { id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0, _count: { products: 1 } },
];
const vaso = {
  id: 'p1',
  name: 'Vaso M',
  slug: 'vaso-m',
  description: 'Cerâmica.',
  price: 89.9,
  images: [],
  categoryId: 'cat1',
  category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
  active: true,
  featured: false,
  order: 0,
  stock: 3,
  leadTimeDays: null,
  availability: 'in_stock',
};

describe('/admin/produtos/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = new URLSearchParams();
  });

  it('opens the product with its actions: see on the site and duplicate', async () => {
    mockApi((path) => (path === '/product-categories' ? categories : vaso));

    render(<ProdutoPage />);

    expect(await screen.findByRole('heading', { name: 'Vaso M', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver no site' })).toHaveAttribute('href', '/produtos/vasos/vaso-m');
    expect(screen.getByRole('link', { name: 'Duplicar' })).toHaveAttribute('href', '/admin/produtos/novo?duplicar=p1');
    expect(screen.getByLabelText('Nome')).toHaveValue('Vaso M');
  });

  it('says the product was just created', async () => {
    search = new URLSearchParams('criado=1');
    mockApi((path) => (path === '/product-categories' ? categories : vaso));

    render(<ProdutoPage />);

    expect(await screen.findByText('Produto criado.')).toBeInTheDocument();
  });

  it('deletes after confirmation and goes back to the list', async () => {
    const apiFetch = mockApi((path, init) =>
      init?.method === 'DELETE' ? undefined : path === '/product-categories' ? categories : vaso,
    );

    render(<ProdutoPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remover produto' }));

    expect(apiFetch).toHaveBeenCalledWith('/products/p1', { method: 'DELETE' });
    expect(push).toHaveBeenCalledWith('/admin/produtos');
  });
});
