import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartView } from './CartView';
import { CartProvider } from './CartProvider';
import { CART_STORAGE_KEY, type CartItem } from '@/features/store/lib/cart-storage';
import { quoteCart } from '@/features/store/lib/store-api';
import type { CheckoutQuote } from '@/features/store/types/store';

jest.mock('@/features/store/lib/store-api');

const vaso: CartItem = {
  productId: 'p1',
  slug: 'vaso-m',
  categorySlug: 'vasos',
  name: 'Vaso M',
  price: 80,
  imageUrl: null,
  quantity: 1,
};
const kit: CartItem = { ...vaso, productId: 'p2', slug: 'kit', categorySlug: 'kits', name: 'Kit Terrário', price: 100 };

function quote(overrides: Partial<CheckoutQuote> = {}): CheckoutQuote {
  return {
    items: [
      {
        productId: 'p1',
        name: 'Vaso M',
        slug: 'vaso-m',
        unitPrice: 89.9,
        quantity: 1,
        lineTotal: 89.9,
        imageUrl: null,
        availability: 'in_stock',
        leadTimeDays: null,
      },
    ],
    subtotal: 89.9,
    installments: 2,
    pickup: { available: false },
    delivery: { available: false, reason: 'no_cep' },
    problems: [],
    ...overrides,
  };
}

function renderCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  return render(
    <CartProvider>
      <CartView />
    </CartProvider>,
  );
}

describe('CartView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    window.gtag = jest.fn();
  });

  afterEach(() => jest.useRealTimers());

  const settle = () => act(async () => jest.advanceTimersByTime(500));

  it('says the cart is empty and points to the products', async () => {
    renderCart([]);

    expect(await screen.findByText('Seu carrinho está vazio.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos');
    expect(quoteCart).not.toHaveBeenCalled();
  });

  it('shows the price from the quote, not the one saved in the cart, and lets the customer check out', async () => {
    (quoteCart as jest.Mock).mockResolvedValue(quote());
    renderCart([vaso]);
    await settle();

    expect(quoteCart).toHaveBeenCalledWith([{ productId: 'p1', quantity: 1 }]);
    expect(screen.getByText('R$ 89,90 cada')).toBeInTheDocument();
    expect(screen.getByText('Pix ou cartão em até 2x sem juros.')).toBeInTheDocument();
    expect(screen.getByText('Frete calculado no próximo passo.')).toBeInTheDocument();
    const checkout = screen.getByRole('link', { name: 'Finalizar compra' });
    expect(checkout).toHaveAttribute('href', '/checkout');

    await act(async () => checkout.click());
    expect(window.gtag).toHaveBeenCalledWith('event', 'begin_checkout', expect.objectContaining({ value: 89.9 }));
  });

  it('marks problem lines and blocks checkout until the customer fixes them', async () => {
    (quoteCart as jest.Mock).mockResolvedValue(
      quote({
        problems: [
          { productId: 'p1', reason: 'insufficient_stock', available: 2 },
          { productId: 'p2', reason: 'inactive' },
        ],
      }),
    );
    renderCart([{ ...vaso, quantity: 3 }, kit]);
    await settle();

    expect(screen.getByText('Só restam 2')).toBeInTheDocument();
    expect(screen.getByText('Não está mais disponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled();
  });

  it('requotes after the quantity changes, without letting the old quote check out', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (quoteCart as jest.Mock).mockResolvedValue(quote());
    renderCart([vaso]);
    await settle();

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Vaso M' }));

    expect(screen.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled();
    expect(screen.getByLabelText('Quantidade de Vaso M')).toHaveTextContent('2');
    await settle();
    expect(quoteCart).toHaveBeenLastCalledWith([{ productId: 'p1', quantity: 2 }]);
  });

  it('removes an item', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (quoteCart as jest.Mock).mockResolvedValue(quote());
    renderCart([vaso, kit]);
    await settle();

    await user.click(screen.getByRole('button', { name: 'Remover Kit Terrário' }));

    expect(screen.queryByText('Kit Terrário')).not.toBeInTheDocument();
  });

  it('offers a retry when the quote fails', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (quoteCart as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(quote());
    renderCart([vaso]);
    await settle();

    expect(screen.getByText(/Não foi possível atualizar os preços agora/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(screen.getByRole('link', { name: 'Finalizar compra' })).toBeInTheDocument());
  });
});
