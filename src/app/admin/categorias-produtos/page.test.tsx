import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoriasProdutosPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const categories = [
  { id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0, _count: { products: 2 } },
  { id: 'cat2', name: 'Kits', slug: 'kits', description: '', active: false, order: 1, _count: { products: 0 } },
];

describe('CategoriasProdutosPage', () => {
  it('lists each category with its address, product count and inactive mark', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(categories) });

    render(<CategoriasProdutosPage />);

    expect(await screen.findByText('Vasos')).toBeInTheDocument();
    expect(screen.getByText('/produtos/vasos')).toBeInTheDocument();
    expect(screen.getByText('2 produto(s)')).toBeInTheDocument();
    expect(screen.getByText('(Inativa)')).toBeInTheDocument();
  });

  it('opens the create dialog', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(categories) });

    render(<CategoriasProdutosPage />);
    await screen.findByText('Vasos');
    await userEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));

    expect(screen.getByRole('heading', { name: 'Nova categoria de produto' })).toBeInTheDocument();
  });

  it('deletes an empty category on confirm and reloads the list', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasProdutosPage />);
    const deleteButtons = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteButtons[1]);

    apiFetch.mockResolvedValueOnce(undefined).mockResolvedValueOnce([categories[0]]);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(apiFetch).toHaveBeenCalledWith('/product-categories/cat2', { method: 'DELETE' });
    expect(await screen.findByText('Vasos')).toBeInTheDocument();
    expect(screen.queryByText('Kits')).not.toBeInTheDocument();
  });

  it('shows the API refusal for a category that still has products inside the dialog', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasProdutosPage />);
    const [deleteVasos] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteVasos);
    expect(screen.getByText(/Essa categoria tem 2 produto\(s\)/)).toBeInTheDocument();

    apiFetch.mockRejectedValueOnce(new Error('Não é possível excluir uma categoria com produtos cadastrados.'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(
      await screen.findByText('Não é possível excluir uma categoria com produtos cadastrados.'),
    ).toBeInTheDocument();
  });
});
