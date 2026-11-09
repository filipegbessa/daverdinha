import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddToCartButton } from './AddToCartButton';
import { CartProvider } from './CartProvider';
import { CartLink } from './CartLink';
import { readCart } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';
import type { Product } from '@/features/site/types/catalog';

const real: Product = { ...SAMPLE_PRODUCTS[0], id: 'p1', availability: 'in_stock' };

function renderButton(product: Product) {
  return render(
    <CartProvider>
      <CartLink />
      <AddToCartButton product={product} />
    </CartProvider>,
  );
}

describe('AddToCartButton', () => {
  beforeEach(() => {
    localStorage.clear();
    window.gtag = jest.fn();
  });

  it('adds to the cart, updates the header count and shows a shortcut for a few seconds', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderButton(real);

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

    expect(readCart()).toEqual([expect.objectContaining({ productId: 'p1', quantity: 1 })]);
    expect(screen.getByRole('link', { name: 'Carrinho, 1 item' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/carrinho');
    expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_cart', {
      currency: 'BRL',
      value: real.price,
      items: [expect.objectContaining({ item_id: 'p1', item_name: real.name, quantity: 1 })],
    });

    act(() => jest.advanceTimersByTime(4000));
    expect(screen.queryByRole('link', { name: 'Ver carrinho' })).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('lets preview samples into the cart, saying the purchase will not go through', async () => {
    const user = userEvent.setup();
    renderButton(SAMPLE_PRODUCTS[0]);

    expect(screen.getByText(/Prévia: produto de exemplo/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));
    expect(readCart()).toEqual([expect.objectContaining({ productId: SAMPLE_PRODUCTS[0].id })]);
  });

  it('does not sell a sold-out product', () => {
    renderButton({ ...real, availability: 'sold_out' });

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled();
  });
});

describe('CartLink', () => {
  beforeEach(() => localStorage.clear());

  it('has no number for an empty cart', () => {
    render(
      <CartProvider>
        <CartLink />
      </CartProvider>,
    );

    expect(screen.getByRole('link', { name: 'Carrinho' })).toHaveAttribute('href', '/carrinho');
  });
});
