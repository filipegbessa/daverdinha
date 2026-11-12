import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from './CartProvider';
import { CartLink } from './CartLink';
import { StoreEnabledProvider } from './StoreEnabled';
import { ProductCard } from '@/features/site/components/ProductCard';
import { readCart } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/data/samples';
import type { Product } from '@/features/site/types/catalog';

const real: Product = { ...SAMPLE_PRODUCTS[0], id: 'p1', availability: 'in_stock' };

function renderCard(product: Product, storeEnabled = true) {
  return render(
    <StoreEnabledProvider value={storeEnabled}>
      <CartProvider>
        <CartLink />
        <ProductCard product={product} />
      </CartProvider>
    </StoreEnabledProvider>,
  );
}

describe('ProductCard add button', () => {
  beforeEach(() => {
    localStorage.clear();
    window.gtag = jest.fn();
  });

  it('adds from the card without leaving the page and confirms for a few seconds', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderCard(real);

    await user.click(screen.getByRole('button', { name: `Adicionar ${real.name} ao carrinho` }));

    expect(readCart()).toEqual([expect.objectContaining({ productId: 'p1', quantity: 1 })]);
    expect(screen.getByRole('link', { name: 'Carrinho, 1 item' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Adicionar ${real.name} ao carrinho` })).toHaveTextContent('Adicionado');
    expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_cart', expect.objectContaining({ value: real.price }));

    act(() => jest.advanceTimersByTime(4000));
    expect(screen.getByRole('button', { name: `Adicionar ${real.name} ao carrinho` })).toHaveTextContent('Adicionar');
    jest.useRealTimers();
  });

  it('keeps the photo and name as the link to the product page, outside the button', () => {
    renderCard(real);

    const link = screen.getByRole('link', { name: new RegExp(real.name) });
    expect(link).toHaveAttribute('href', expect.stringContaining(real.slug));
    expect(link).not.toContainElement(screen.getByRole('button'));
  });

  it('does not sell a sold-out product', () => {
    renderCard({ ...real, availability: 'sold_out' });

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled();
  });

  it('has no button with the store off', () => {
    render(
      <StoreEnabledProvider value={false}>
        <ProductCard product={real} />
      </StoreEnabledProvider>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
