import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuyAgainButton } from './BuyAgainButton';
import { CartProvider } from './CartProvider';
import { readCart } from '@/features/store/lib/cart-storage';
import { SAMPLE_PRODUCTS } from '@/features/site/test-fixtures/catalog';
import type { Product } from '@/features/site/types/catalog';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const vaso: Product = { ...SAMPLE_PRODUCTS[0], id: 'p1' };
const muda: Product = { ...SAMPLE_PRODUCTS[2], id: 'p2' };

function renderButton(props: Parameters<typeof BuyAgainButton>[0]) {
  return render(
    <CartProvider>
      <BuyAgainButton {...props} />
    </CartProvider>,
  );
}

describe('BuyAgainButton', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('puts the same items and quantities in the cart and goes to it', async () => {
    renderButton({
      items: [
        { product: vaso, quantity: 2 },
        { product: muda, quantity: 1 },
      ],
      missing: 0,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Comprar de novo' }));

    expect(readCart()).toEqual([
      expect.objectContaining({ productId: 'p1', quantity: 2 }),
      expect.objectContaining({ productId: 'p2', quantity: 1 }),
    ]);
    expect(push).toHaveBeenCalledWith('/carrinho');
  });

  it('says how many items were left out', () => {
    renderButton({ items: [{ product: vaso, quantity: 1 }], missing: 2 });
    expect(screen.getByText('2 itens deste pedido não estão mais disponíveis e ficam de fora.')).toBeInTheDocument();
  });

  it('renders nothing when no item is still for sale', () => {
    const { container } = renderButton({ items: [], missing: 2 });
    expect(container).toBeEmptyDOMElement();
  });
});
