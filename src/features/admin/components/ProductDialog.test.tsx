import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductDialog } from './ProductDialog';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const categories: ProductCategoryAdmin[] = [
  { id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0, _count: { products: 1 } },
  { id: 'cat2', name: 'Kits', slug: 'kits', description: '', active: true, order: 1, _count: { products: 0 } },
];

const vaso: ProductAdmin = {
  id: 'p1',
  name: 'Vaso M',
  slug: 'vaso-m',
  description: 'Cerâmica.',
  price: 89.9,
  images: ['https://blob/1.jpg'],
  categoryId: 'cat1',
  category: { id: 'cat1', name: 'Vasos', slug: 'vasos' },
  active: true,
  featured: false,
  order: 0,
};

/** O que foi enviado no FormData da última chamada, como objeto simples. */
function sentForm(apiFetch: jest.Mock) {
  const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
  return { body, fields: Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string')) };
}

describe('ProductDialog', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
  });

  it('creates a product as multipart with text fields, flags and photos', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductDialog product={null} categories={categories} onClose={jest.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Kit Suculentas');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Três mudas.');
    // Máscara de centavos: cada dígito digitado empurra o valor pra esquerda, então "5990" vira R$ 59,90.
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '5990');
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'cat2');
    await userEvent.click(screen.getByRole('switch', { name: 'Destaque' }));
    await userEvent.upload(screen.getByLabelText('Fotos'), new File(['x'], 'kit.jpg', { type: 'image/jpeg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/products', { method: 'POST', body: expect.any(FormData) });
    const { body, fields } = sentForm(apiFetch);
    expect(fields).toEqual({
      name: 'Kit Suculentas',
      description: 'Três mudas.',
      price: '59.90',
      categoryId: 'cat2',
      active: 'true',
      featured: 'true',
    });
    expect((body.getAll('images') as File[]).map((f) => f.name)).toEqual(['kit.jpg']);
    expect(onSaved).toHaveBeenCalled();
  });

  it('edits without sending images when no new photo was chosen, so the current ones stay', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ProductDialog product={vaso} categories={categories} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByText('/produtos/vasos/vaso-m')).toBeInTheDocument();
    expect(screen.getByLabelText('Preço (R$)')).toHaveValue('R$ 89,90');
    await userEvent.clear(screen.getByLabelText('Preço (R$)'));
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '9500');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/products/p1', { method: 'PATCH', body: expect.any(FormData) });
    const { body, fields } = sentForm(apiFetch);
    expect(fields.price).toBe('95.00');
    expect(fields.featured).toBe('false');
    expect(body.has('images')).toBe(false);
  });

  it('asks for a category first when none exists', () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });

    render(<ProductDialog product={null} categories={[]} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByText(/Cadastre uma categoria primeiro/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para categorias' })).toHaveAttribute(
      'href',
      '/admin/categorias',
    );
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument();
  });

  it('shows the API error and stays open', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Categoria não encontrada.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductDialog product={vaso} categories={categories} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Categoria não encontrada.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
