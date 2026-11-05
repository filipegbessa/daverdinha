import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCategoryDialog } from './ProductCategoryDialog';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { ProductCategoryAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const vasos: ProductCategoryAdmin = {
  id: 'cat1',
  name: 'Vasos',
  slug: 'vasos',
  description: 'Vasos de cerâmica.',
  active: true,
  order: 2,
  _count: { products: 3 },
};

describe('ProductCategoryDialog', () => {
  it('creates a category as JSON, active by default', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductCategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), ' Suculentas ');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Pequenas e fáceis.');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/product-categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Suculentas', description: 'Pequenas e fáceis.', order: 0, active: true }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('edits with PATCH and shows the fixed address instead of an editable slug', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ProductCategoryDialog category={vasos} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByText('/produtos/vasos')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordem')).toHaveValue(2);

    await userEvent.click(screen.getByRole('switch', { name: 'Aparece no site' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/product-categories/cat1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Vasos', description: 'Vasos de cerâmica.', order: 2, active: false }),
    });
  });

  it('keeps the dialog open with the API message when saving fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe uma categoria com esse nome.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductCategoryDialog category={vasos} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome.');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
