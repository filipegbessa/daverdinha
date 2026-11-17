import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './ProductForm';
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
  const apiFetch = jest.fn().mockResolvedValue(vaso);
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

/** O que foi enviado no FormData da última chamada, como objeto simples. */
function sentForm(apiFetch: jest.Mock) {
  const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
  return { body, fields: Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string')) };
}

describe('ProductForm', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
  });

  it('creates a product as multipart with text fields, flags and photos', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ...vaso, id: 'new' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductForm product={null} categories={categories} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Kit Suculentas');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Três mudas.');
    // Máscara de centavos: cada dígito digitado empurra o valor pra esquerda, então "5990" vira R$ 59,90.
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '5990');
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'cat2');
    await userEvent.type(screen.getByLabelText('Estoque'), '4');
    await userEvent.click(screen.getByRole('switch', { name: 'Destaque' }));
    await userEvent.upload(screen.getByLabelText('Fotos'), new File(['x'], 'kit.jpg', { type: 'image/jpeg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(apiFetch).toHaveBeenCalledWith('/products', { method: 'POST', body: expect.any(FormData) });
    const { body, fields } = sentForm(apiFetch);
    expect(fields).toEqual({
      name: 'Kit Suculentas',
      description: 'Três mudas.',
      price: '59.90',
      promoPrice: '',
      promoStartsAt: '',
      promoEndsAt: '',
      categoryId: 'cat2',
      active: 'true',
      featured: 'true',
      stock: '4',
    });
    expect((body.getAll('images') as File[]).map((f) => f.name)).toEqual(['kit.jpg']);
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 'new' }));
  });

  it('edits without sending images when no new photo was chosen, so the current ones stay', async () => {
    const apiFetch = mockSave();

    render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

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

    render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

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

    render(<ProductForm product={encomenda} categories={categories} onSaved={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Sob encomenda' })).toBeChecked();
    expect(screen.getByLabelText('Estoque')).toBeDisabled();
    expect(screen.getByLabelText('Prazo de confecção (dias)')).toHaveValue(10);
  });

  it('back to ready stock: asks for the quantity and keeps the saved lead time out of the request', async () => {
    const apiFetch = mockSave();

    render(<ProductForm product={encomenda} categories={categories} onSaved={jest.fn()} />);
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

    render(<ProductForm product={{ ...encomenda, leadTimeDays: null }} categories={categories} onSaved={jest.fn()} />);
    await userEvent.type(screen.getByLabelText('Nome'), ' novo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o prazo de confecção, de 1 a 180 dias.');
  });

  it('shows the API error and stays open', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Categoria não encontrada.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<ProductForm product={vaso} categories={categories} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Nome'), ' novo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Categoria não encontrada.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('only saves a product after a change, and can discard the changes', async () => {
    mockSave();
    render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Nome'), ' grande');
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Vaso M');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('says the changes were saved and is clean again', async () => {
    mockSave();
    render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Nome'), ' grande');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
    expect(screen.queryByText('Alterações não salvas')).not.toBeInTheDocument();
  });

  it('warns before leaving the tab with unsaved changes', async () => {
    mockSave();
    render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);
    await userEvent.type(screen.getByLabelText('Nome'), ' grande');

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('shows a preview of the store card with the name, category and price', async () => {
    mockSave();
    render(<ProductForm product={null} categories={categories} onSaved={jest.fn()} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Kit');

    expect(screen.getByLabelText('Prévia do card na loja')).toHaveTextContent('VasosKitR$ 0,00');
  });

  it('starts a duplicate from the given values', () => {
    mockSave();
    render(
      <ProductForm
        product={null}
        initial={{ ...vaso, name: 'Vaso M (cópia)', active: false }}
        categories={categories}
        onSaved={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Nome')).toHaveValue('Vaso M (cópia)');
    expect(screen.getByRole('switch', { name: 'Aparece no site' })).not.toBeChecked();
    expect(screen.getByLabelText('Estoque')).toHaveValue(3);
  });

  describe('promo price', () => {
    it('sends a scheduled promo, with the times in Rio as UTC', async () => {
      const apiFetch = mockSave();
      render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

      await userEvent.type(screen.getByLabelText('Preço promocional (opcional)'), '6990');
      expect(screen.getByText(/de R\$ 89,90 por R\$ 69,90", 22% de desconto/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('checkbox', { name: 'Agendar a promoção' }));
      await userEvent.type(screen.getByLabelText('Começa em'), '2026-12-01T00:00');
      await userEvent.type(screen.getByLabelText('Termina em'), '2026-12-08T00:00');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      const { fields } = sentForm(apiFetch);
      expect(fields).toMatchObject({
        price: '89.90',
        promoPrice: '69.90',
        promoStartsAt: '2026-12-01T03:00:00.000Z',
        promoEndsAt: '2026-12-08T03:00:00.000Z',
      });
    });

    it('does not save a promo price that is not below the price', async () => {
      const apiFetch = mockSave();
      render(<ProductForm product={vaso} categories={categories} onSaved={jest.fn()} />);

      await userEvent.type(screen.getByLabelText('Preço promocional (opcional)'), '9990');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(apiFetch).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Preço promocional (opcional)')).toHaveAccessibleDescription(
        expect.stringContaining('O preço promocional precisa ser menor que o preço.'),
      );
    });

    it('edits the full price of a product on sale and can take the promo out', async () => {
      const apiFetch = mockSave();
      render(
        <ProductForm
          product={{ ...vaso, price: 69.9, listPrice: 89.9, regularPrice: 89.9, promoPrice: 69.9 }}
          categories={categories}
          onSaved={jest.fn()}
        />,
      );

      expect(screen.getByLabelText('Preço (R$)')).toHaveValue('R$ 89,90');
      expect(screen.getByLabelText('Preço promocional (opcional)')).toHaveValue('R$ 69,90');
      await userEvent.click(screen.getByRole('button', { name: 'Tirar a promoção' }));
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(sentForm(apiFetch).fields).toMatchObject({ price: '89.90', promoPrice: '' });
    });
  });
});
