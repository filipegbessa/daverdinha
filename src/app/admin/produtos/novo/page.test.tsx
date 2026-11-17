import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovoProdutoPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');
const push = jest.fn();
let search = new URLSearchParams();
jest.mock('next/navigation', () => ({
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
  images: ['https://blob/1.jpg'],
  categoryId: 'cat1',
  category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
  active: true,
  featured: true,
  order: 0,
  stock: 3,
  leadTimeDays: null,
  availability: 'in_stock',
};

describe('/admin/produtos/novo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = new URLSearchParams();
  });

  it('creates the product and opens its page', async () => {
    mockApi((path, init) => (init?.method === 'POST' ? { ...vaso, id: 'p9' } : categories));

    render(<NovoProdutoPage />);
    await userEvent.type(await screen.findByLabelText('Nome'), 'Kit');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Três mudas.');
    await userEvent.type(screen.getByLabelText('Estoque'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(push).toHaveBeenCalledWith('/admin/produtos/p9?criado=1');
  });

  it('duplicates a product: same data as a hidden copy, without the photos', async () => {
    search = new URLSearchParams('duplicar=p1');
    mockApi((path) => (path === '/product-categories' ? categories : vaso));

    render(<NovoProdutoPage />);

    expect(await screen.findByRole('heading', { name: 'Duplicar produto' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Nome')).toHaveValue('Vaso M (cópia)');
    expect(screen.getByRole('switch', { name: 'Aparece no site' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Destaque' })).not.toBeChecked();
    expect(screen.getByText(/Escolha as fotos de novo/)).toBeInTheDocument();
  });

  it('asks for a category first when none exists', async () => {
    mockApi(() => []);

    render(<NovoProdutoPage />);

    expect(await screen.findByText(/Cadastre uma categoria primeiro/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para categorias' })).toHaveAttribute('href', '/admin/categorias');
  });
});
