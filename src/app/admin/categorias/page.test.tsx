import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoriasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const categories = [
  { id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0, _count: { products: 2 } },
  { id: 'cat2', name: 'Kits', slug: 'kits', description: '', active: false, order: 1, _count: { products: 0 } },
];

describe('CategoriasPage', () => {
  it('lists each category with its situation, order when set and product count, without the address', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(categories) });

    render(<CategoriasPage />);

    expect(await screen.findByText('Vasos')).toBeInTheDocument();
    expect(screen.getByText('Aparece no site · 2 produto(s)')).toBeInTheDocument();
    expect(screen.getByText('Oculta · Ordem 1 · 0 produto(s)')).toBeInTheDocument();
    expect(screen.queryByText('/produtos/vasos')).not.toBeInTheDocument();
  });

  it('filters by name ignoring accents and by situation', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(categories) });

    render(<CategoriasPage />);
    await screen.findByText('Vasos');

    await userEvent.type(screen.getByLabelText('Buscar categorias'), 'VÁSOS');
    expect(screen.getByText('Vasos')).toBeInTheDocument();
    expect(screen.queryByText('Kits')).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Buscar categorias'));
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por situação'), 'inactive');
    expect(screen.getByText('Kits')).toBeInTheDocument();
    expect(screen.queryByText('Vasos')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Buscar categorias'), 'xyz');
    expect(screen.getByText('Nenhuma categoria encontrada com esses filtros.')).toBeInTheDocument();
  });

  it('opens the create dialog', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(categories) });

    render(<CategoriasPage />);
    await screen.findByText('Vasos');
    await userEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));

    expect(screen.getByRole('heading', { name: 'Nova categoria' })).toBeInTheDocument();
  });

  it('deletes an empty category on confirm and reloads the list', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
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

    render(<CategoriasPage />);
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
