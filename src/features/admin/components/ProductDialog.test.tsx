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
  stock: 3,
  leadTimeDays: null,
  availability: 'in_stock',
};

const encomenda: ProductAdmin = {
  ...vaso,
  id: 'p2',
  stock: null,
  leadTimeDays: 10,
  availability: 'made_to_order',
};

function mockSave() {
  const apiFetch = jest.fn().mockResolvedValue(undefined);
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

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
    await userEvent.type(screen.getByLabelText('Estoque'), '4');
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
      stock: '4',
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
    expect(fields.stock).toBe('3');
    expect(body.has('leadTimeDays')).toBe(false);
    expect(body.has('images')).toBe(false);
  });

  it('turns a product into made-to-order: disables the quantity and sends the lead time', async () => {
    const apiFetch = mockSave();

    render(<ProductDialog product={vaso} categories={categories} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.queryByLabelText('Prazo de confecção (dias)')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sob encomenda' }));
    expect(screen.getByLabelText('Estoque')).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Prazo de confecção (dias)'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const { fields } = sentForm(apiFetch);
    expect(fields.stock).toBe('');
    expect(fields.leadTimeDays).toBe('12');
  });

  it('opens a made-to-order product with the box checked and its lead time', () => {
    mockSave();

    render(<ProductDialog product={encomenda} categories={categories} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Sob encomenda' })).toBeChecked();
    expect(screen.getByLabelText('Estoque')).toBeDisabled();
    expect(screen.getByLabelText('Prazo de confecção (dias)')).toHaveValue(10);
  });

  it('back to ready stock: asks for the quantity and keeps the saved lead time out of the request', async () => {
    const apiFetch = mockSave();

    render(<ProductDialog product={encomenda} categories={categories} onClose={jest.fn()} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sob encomenda' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Estoque')).toHaveAccessibleDescription(
      '0 = esgotado. Informe a quantidade em estoque (0 se estiver esgotado).',
    );

    await userEvent.type(screen.getByLabelText('Estoque'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const { body, fields } = sentForm(apiFetch);
    expect(fields.stock).toBe('0');
    expect(body.has('leadTimeDays')).toBe(false);
  });

  it('does not save made-to-order without a lead time', async () => {
    const apiFetch = mockSave();

    render(
      <ProductDialog
        product={{ ...encomenda, leadTimeDays: null }}
        categories={categories}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o prazo de confecção, de 1 a 180 dias.');
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
