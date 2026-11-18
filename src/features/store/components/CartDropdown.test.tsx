import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartDropdown } from './CartDropdown';
import { CartProvider, useCart } from './CartProvider';
import { CART_STORAGE_KEY, readCart, type CartItem } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/test-fixtures/catalog';

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

/** Computador com mouse (`true`) ou celular (`false`). */
function mockHoverScreen(hover: boolean) {
  window.matchMedia = ((query: string) => {
    const base = originalMatchMedia(query);
    if (query !== '(hover: hover) and (min-width: 640px)') return base;
    return { ...base, matches: hover, media: query };
  }) as typeof window.matchMedia;
}

const panel = () => screen.queryByRole('region', { name: 'Resumo do carrinho' });

describe('CartDropdown', () => {
  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/produtos');
    mockHoverScreen(true);
  });

  it('is a link to the cart page, with the count', async () => {
    renderDropdown([vaso]);
    expect(await screen.findByRole('link', { name: 'Carrinho, 2 itens' })).toHaveAttribute('href', '/carrinho');
  });

  it('shows a compact summary on hover: items, quantity × price, subtotal and checkout', async () => {
    renderDropdown([vaso]);

    await userEvent.hover(await screen.findByRole('link', { name: 'Carrinho, 2 itens' }));
    const summary = within(panel()!);

    expect(summary.getByRole('link', { name: 'Vaso M' })).toHaveAttribute('href', '/produtos/vasos/vaso-m');
    expect(summary.getByText('2 × R$ 89,90')).toBeInTheDocument();
    expect(summary.getByText('Subtotal').parentElement).toHaveTextContent('R$ 179,80');
    expect(summary.getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute('href', '/checkout');
    expect(summary.getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/carrinho');

    await userEvent.click(summary.getByRole('button', { name: 'Remover Vaso M' }));
    expect(readCart()).toEqual([]);
  });

  it('closes when the mouse leaves, and with Esc', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderDropdown([vaso]);
    const trigger = await screen.findByRole('link', { name: 'Carrinho, 2 itens' });

    await user.hover(trigger);
    expect(panel()).toBeInTheDocument();
    await user.unhover(trigger);
    act(() => jest.advanceTimersByTime(200));
    expect(panel()).not.toBeInTheDocument();

    await user.hover(trigger);
    await user.keyboard('{Escape}');
    expect(panel()).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('opens by itself for a few seconds when a product is added', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderDropdown();

    await user.click(screen.getByRole('button', { name: 'adicionar' }));
    expect(panel()).toHaveTextContent(SAMPLE_PRODUCTS[0].name);

    act(() => jest.advanceTimersByTime(4000));
    expect(panel()).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('has no panel on a phone, neither on hover nor after adding', async () => {
    mockHoverScreen(false);
    renderDropdown([vaso]);

    await userEvent.hover(await screen.findByRole('link', { name: 'Carrinho, 2 itens' }));
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }));

    expect(panel()).not.toBeInTheDocument();
  });

  it('does not open on the cart page', async () => {
    window.history.pushState({}, '', '/carrinho');
    renderDropdown([vaso]);

    await userEvent.hover(await screen.findByRole('link', { name: 'Carrinho, 2 itens' }));
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }));

    expect(panel()).not.toBeInTheDocument();
  });
});
