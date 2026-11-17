import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovoPedidoPage from './page';
import { mockApi, paginated } from '@/features/admin/test-fixtures/mock-api';
import { quoteCart } from '@/features/store/lib/store-api';
import { fetchStreetByCep } from '@/features/store/lib/address-by-cep';

jest.mock('@/features/admin/lib/api-client');
jest.mock('@/features/store/lib/store-api');
jest.mock('@/features/store/lib/address-by-cep');

const vaso = {
  id: 'p1',
  name: 'Vaso M',
  slug: 'vaso-m',
  description: 'd',
  price: 89.9,
  images: [],
  categoryId: 'c1',
  category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
  active: true,
  featured: false,
  order: 0,
  stock: 3,
  leadTimeDays: null,
  availability: 'in_stock',
};

const quote = {
  items: [],
  subtotal: 89.9,
  installments: 2,
  pickup: { available: true, address: 'R. Capiberibe, 32', hours: 'Seg a sex', instructions: null },
  delivery: { available: false, reason: 'no_cep' },
  problems: [],
};

async function fillCustomer() {
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Maria Souza');
  await userEvent.type(screen.getByLabelText('WhatsApp'), '21999998888');
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await userEvent.type(screen.getByLabelText('CPF, CNPJ ou passaporte'), '11144477735');
}

describe('/admin/pedidos/novo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (quoteCart as jest.Mock).mockResolvedValue(quote);
    (fetchStreetByCep as jest.Mock).mockResolvedValue('Rua do Catete');
  });

  it('builds the order, creates it and gives the payment link to send on WhatsApp', async () => {
    const apiFetch = mockApi((path, init) =>
      init?.method === 'POST'
        ? { id: 'o1', code: 'DV-0042', token: 'tok', paymentUrl: 'https://pagar.me/x' }
        : paginated([vaso]),
    );

    render(<NovoPedidoPage />);
    await userEvent.type(screen.getByLabelText('Buscar produto'), 'vaso');
    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar Vaso M' }));
    expect(within(screen.getByRole('list', { name: 'Itens do pedido' })).getByText(/Vaso M/)).toBeInTheDocument();

    await fillCustomer();
    await userEvent.click(screen.getByRole('radio', { name: 'Retirada no ateliê' }));
    await userEvent.click(screen.getByRole('button', { name: 'Criar pedido e gerar link' }));

    expect(apiFetch).toHaveBeenCalledWith('/site-orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: 'p1', quantity: 1 }],
        customer: {
          name: 'Maria Souza',
          email: 'maria@exemplo.com',
          phone: '21999998888',
          document: '11144477735',
        },
        deliveryMethod: 'pickup',
      }),
    });
    expect(await screen.findByRole('heading', { name: 'Pedido DV-0042 criado' })).toBeInTheDocument();
    expect(screen.getByLabelText('Link de pagamento')).toHaveValue('https://pagar.me/x');
    const whatsapp = screen.getByRole('link', { name: /Enviar no WhatsApp/ });
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5521999998888\?text=/);
    expect(decodeURIComponent(whatsapp.getAttribute('href')!)).toContain(
      'Oi, Maria! Aqui está o link pra pagar o pedido DV-0042',
    );
    expect(screen.getByRole('link', { name: 'Ver pedido' })).toHaveAttribute('href', '/admin/pedidos/o1');
  });

  it('asks for the products, the customer and the address before creating', async () => {
    const apiFetch = mockApi(() => paginated([]));

    render(<NovoPedidoPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Criar pedido e gerar link' }));

    expect(screen.getByText('Adicione pelo menos um produto.')).toBeInTheDocument();
    expect(screen.getByText('Informe um CEP com 8 números.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalledWith('/site-orders', expect.anything());
  });

  it('fills the street from the CEP', async () => {
    mockApi(() => paginated([]));

    render(<NovoPedidoPage />);
    await userEvent.type(screen.getByLabelText('CEP'), '22220000');

    expect(await screen.findByDisplayValue('Rua do Catete')).toBeInTheDocument();
  });
});
