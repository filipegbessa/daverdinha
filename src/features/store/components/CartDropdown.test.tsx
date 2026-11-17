import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartDropdown } from './CartDropdown';
import { CartProvider, useCart } from './CartProvider';
import { CART_STORAGE_KEY, readCart, type CartItem } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';

const vaso: CartItem = {
  productId: 'p1',
  slug: 'vaso-m',
  categorySlug: 'vasos',
  name: 'Vaso M',
  price: 89.9,
  imageUrl: null,
  quantity: 2,
};

function AddButton() {
  const { add } = useCart();
  return (
    <button type="button" onClick={() => add({ ...SAMPLE_PRODUCTS[0], id: 'p9' })}>
      adicionar
    </button>
  );
}

function renderDropdown(items: CartItem[] = []) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  return render(
    <CartProvider>
      <CartDropdown />
      <AddButton />
    </CartProvider>,
  );
}

const originalMatchMedia = window.matchMedia;

/** Só a consulta de tela grande do dropdown muda; as outras seguem o padrão do jest.setup. */
function mockDesktop(desktop: boolean) {
  window.matchMedia = ((query: string) => {
    const base = originalMatchMedia(query);
    if (query !== '(min-width: 640px)') return base;
    return { ...base, matches: desktop, media: query };
  }) as typeof window.matchMedia;
}

describe('CartDropdown', () => {
  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/produtos');
    mockDesktop(false);
  });

  it('opens a dropdown with the items, the subtotal and the two ways forward', async () => {
    renderDropdown([vaso]);

    await userEvent.click(await screen.findByRole('button', { name: 'Carrinho, 2 itens' }));
    const panel = await screen.findByRole('dialog');

    expect(within(panel).getByText('Vaso M')).toHaveAttribute('href', '/produtos/vasos/vaso-m');
    expect(within(panel).getByText('Subtotal').parentElement).toHaveTextContent('R$ 179,80');
    expect(within(panel).getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute('href', '/checkout');
    expect(within(panel).getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/carrinho');
  });

  it('changes the quantity and removes items right there', async () => {
    renderDropdown([vaso]);
    await userEvent.click(await screen.findByRole('button', { name: 'Carrinho, 2 itens' }));
    const panel = await screen.findByRole('dialog');

    await userEvent.click(within(panel).getByRole('button', { name: 'Aumentar' }));
    expect(readCart()[0].quantity).toBe(3);

    await userEvent.click(within(panel).getByRole('button', { name: 'Remover Vaso M' }));
    expect(readCart()).toEqual([]);
    expect(within(panel).getByText('Seu carrinho está vazio.')).toBeInTheDocument();
  });

  it('opens by itself when a product is added on a large screen', async () => {
    mockDesktop(true);
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(SAMPLE_PRODUCTS[0].name);
  });

  it('stays closed when adding on a phone, and on the cart page', async () => {
    renderDropdown();
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    mockDesktop(true);
    window.history.pushState({}, '', '/carrinho');
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with Esc and with a click outside, giving the focus back to the icon', async () => {
    renderDropdown([vaso]);
    const trigger = await screen.findByRole('button', { name: 'Carrinho, 2 itens' });

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no number for an empty cart', () => {
    renderDropdown();
    expect(screen.getByRole('button', { name: 'Carrinho' })).toBeInTheDocument();
  });
});
