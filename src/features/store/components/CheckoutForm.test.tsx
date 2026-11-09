import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutForm } from './CheckoutForm';
import { CartProvider } from './CartProvider';
import { CART_STORAGE_KEY, readCart, type CartItem } from '@/features/store/lib/cart-storage';
import { createCheckout, quoteCart } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import type { CheckoutQuote } from '@/features/store/types/store';

jest.mock('@/features/store/lib/store-api');
jest.mock('@/features/store/lib/redirect-to-payment');
const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const item: CartItem = {
  productId: 'p1',
  slug: 'vaso-m',
  categorySlug: 'vasos',
  name: 'Vaso M',
  price: 89.9,
  imageUrl: null,
  quantity: 1,
};

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
        availability: 'made_to_order',
        leadTimeDays: 10,
      },
    ],
    subtotal: 89.9,
    installments: 2,
    pickup: { available: true, address: 'R. Capiberibe, 32', hours: 'Seg a sex, 10h às 18h', instructions: null },
    delivery: { available: false, reason: 'no_cep' },
    problems: [],
    ...overrides,
  };
}

const covered = quote({ delivery: { available: true, fee: 15, bairro: 'Catete', area: 'Perto' } });

function renderCheckout(items: CartItem[] = [item]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  return render(
    <CartProvider>
      <CheckoutForm />
    </CartProvider>,
  );
}

async function fillContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), 'Maria Souza');
  await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await user.type(screen.getByLabelText('WhatsApp'), '21999998888');
}

async function fillAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('CEP'), '22220000');
  await user.type(screen.getByLabelText('Rua'), 'Rua do Catete');
  await user.type(screen.getByLabelText('Número'), '100');
}

describe('CheckoutForm', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    (quoteCart as jest.Mock).mockImplementation(async (_items, cep?: string) => (cep ? covered : quote()));
  });

  it('sends an empty cart back to the cart page', async () => {
    renderCheckout([]);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/carrinho'));
  });

  it('quotes the delivery once the CEP is complete and adds it to the total', async () => {
    const user = userEvent.setup();
    renderCheckout();
    expect(await screen.findByText('Total')).toBeInTheDocument();

    await user.type(screen.getByLabelText('CEP'), '22220000');

    expect(screen.getByLabelText('CEP')).toHaveValue('22220-000');
    expect(await screen.findByText(/Entrega em Catete:/)).toBeInTheDocument();
    expect(quoteCart).toHaveBeenLastCalledWith([{ productId: 'p1', quantity: 1 }], '22220000');
    expect(screen.getByText('R$ 104,90')).toBeInTheDocument();
    expect(screen.getByText(/a entrega acontece depois da confecção, em até 10 dias/)).toBeInTheDocument();
  });

  it('shows what is missing next to each field and does not send', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByText('Total');

    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription('Informe seu nome.');
    expect(screen.getByLabelText('CEP')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Confirme que leu a política de trocas.')).toBeInTheDocument();
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('creates the order with only ids and quantities, clears the cart and goes to the payment page', async () => {
    const user = userEvent.setup();
    (createCheckout as jest.Mock).mockResolvedValue({ ok: true, code: 'DV-0001', token: 't', paymentUrl: 'https://pagar.me/x' });
    renderCheckout();
    await screen.findByText('Total');

    await fillContact(user);
    await fillAddress(user);
    await screen.findByText(/Entrega em Catete:/);
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));
    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(createCheckout).toHaveBeenCalledWith({
      items: [{ productId: 'p1', quantity: 1 }],
      customer: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '21999998888' },
      deliveryMethod: 'delivery',
      address: { cep: '22220000', street: 'Rua do Catete', number: '100' },
    });
    expect(redirectToPayment).toHaveBeenCalledWith('https://pagar.me/x');
    expect(readCart()).toEqual([]);
  });

  it('picks up at the atelier without asking for an address', async () => {
    const user = userEvent.setup();
    (createCheckout as jest.Mock).mockResolvedValue({ ok: true, code: 'DV-0002', token: 't', paymentUrl: 'https://pay' });
    renderCheckout();
    await screen.findByText('Total');

    await user.click(screen.getByRole('radio', { name: /Retirar no ateliê/ }));
    expect(screen.getByText('R. Capiberibe, 32')).toBeInTheDocument();
    expect(screen.queryByLabelText('CEP')).not.toBeInTheDocument();
    await fillContact(user);
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));
    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryMethod: 'pickup', customer: expect.anything() }),
    );
    expect((createCheckout as jest.Mock).mock.calls[0][0]).not.toHaveProperty('address');
  });

  it('does not offer pickup when the store turned it off', async () => {
    (quoteCart as jest.Mock).mockResolvedValue(quote({ pickup: { available: false } }));
    renderCheckout();
    await screen.findByText('Total');

    expect(screen.queryByRole('radio', { name: /Retirar no ateliê/ })).not.toBeInTheDocument();
  });

  it('explains when there is no delivery to the CEP and blocks the order', async () => {
    const user = userEvent.setup();
    (quoteCart as jest.Mock).mockImplementation(async (_items, cep?: string) =>
      quote(cep ? { delivery: { available: false, reason: 'no_area', bairro: 'Gávea' } } : {}),
    );
    renderCheckout();
    await screen.findByText('Total');

    await fillContact(user);
    await fillAddress(user);
    expect(await screen.findByText(/Ainda não entregamos em Gávea pelo site/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));
    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(createCheckout).not.toHaveBeenCalled();
    expect(screen.getByLabelText('CEP')).toHaveAccessibleDescription('Ainda não entregamos em Gávea pelo site.');
  });

  it('keeps the cart and shows a retry message when payment cannot start', async () => {
    const user = userEvent.setup();
    let resolve: (value: unknown) => void = () => {};
    (createCheckout as jest.Mock).mockReturnValue(new Promise((r) => (resolve = r)));
    renderCheckout();
    await screen.findByText('Total');
    await user.click(screen.getByRole('radio', { name: /Retirar no ateliê/ }));
    await fillContact(user);
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));

    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));
    // Durante o envio: um clique só, sem pedido em dobro.
    expect(screen.getByRole('button', { name: 'Abrindo o pagamento...' })).toBeDisabled();

    resolve({ ok: false, status: 503, message: 'Não foi possível iniciar o pagamento. Tente de novo em instantes.' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente de novo em instantes');
    expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).toBeEnabled();
    expect(readCart()).toHaveLength(1);
  });

  it('requotes when the stock changed in the meantime and points back to the cart', async () => {
    const user = userEvent.setup();
    (createCheckout as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      message: 'Estoque mudou.',
      problems: [{ productId: 'p1', reason: 'insufficient_stock', available: 0 }],
    });
    renderCheckout();
    await screen.findByText('Total');
    await user.click(screen.getByRole('radio', { name: /Retirar no ateliê/ }));
    await fillContact(user);
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));
    (quoteCart as jest.Mock).mockResolvedValue(
      quote({ problems: [{ productId: 'p1', reason: 'insufficient_stock', available: 0 }] }),
    );

    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText('Alguns itens mudaram desde que você montou o carrinho.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Voltar ao carrinho' })).toHaveAttribute('href', '/carrinho');
    expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).toBeDisabled();
  });

  it('shows a 422 on the CEP field', async () => {
    const user = userEvent.setup();
    (createCheckout as jest.Mock).mockResolvedValue({ ok: false, status: 422, message: 'Não entregamos nesse CEP.', reason: 'no_area' });
    renderCheckout();
    await screen.findByText('Total');
    await fillContact(user);
    await fillAddress(user);
    await screen.findByText(/Entrega em Catete:/);
    await user.click(screen.getByRole('checkbox', { name: /política de trocas/ }));

    await user.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    await waitFor(() =>
      expect(screen.getByLabelText('CEP')).toHaveAccessibleDescription('Não entregamos nesse CEP.'),
    );
  });
});
