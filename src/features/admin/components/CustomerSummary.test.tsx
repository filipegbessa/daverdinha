import { render, screen, waitFor } from '@testing-library/react';
import { CustomerSummary } from './CustomerSummary';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import type { CustomerByPhone } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const withCustomer: CustomerByPhone = {
  customer: {
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    ordersCount: 2,
    totalSpent: 150.5,
    lastOrderAt: '2026-11-10T15:00:00Z',
  },
  recentOrders: [
    {
      id: 'o2',
      code: 'DV-0043',
      kind: 'products',
      status: 'pending_payment',
      total: 99,
      createdAt: '2026-11-12T10:00:00Z',
    },
    { id: 'o1', code: 'DV-0042', kind: 'products', status: 'paid', total: 100, createdAt: '2026-11-10T15:00:00Z' },
  ],
  conversationId: 'conv1',
};

describe('CustomerSummary', () => {
  it('shows the purchases of the conversation phone, with links to the orders', async () => {
    const apiFetch = mockApi(() => withCustomer);
    render(<CustomerSummary phone="5521984448130" variant="conversation" />);

    expect(await screen.findByText('Cliente da loja')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/customers/by-phone?phone=5521984448130');
    expect(screen.getByText(/2 pedidos pagos/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DV-0043/ })).toHaveAttribute('href', '/admin/pedidos/o2');
    expect(screen.getByRole('link', { name: 'todos os pedidos' })).toHaveAttribute(
      'href',
      '/admin/pedidos?q=ana%40exemplo.com',
    );
  });

  it('shows nothing in the conversation when the phone never ordered', async () => {
    const apiFetch = mockApi(() => ({ customer: null, recentOrders: [], conversationId: 'conv1' }));
    const { container } = render(<CustomerSummary phone="5521984448130" variant="conversation" />);

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('links the order to the WhatsApp conversation', async () => {
    mockApi(() => withCustomer);
    render(<CustomerSummary phone="5521984448130" variant="order" currentOrderId="o1" />);

    expect(await screen.findByRole('link', { name: /Abrir conversa/ })).toHaveAttribute(
      'href',
      '/admin/conversas/conv1',
    );
    expect(screen.getByRole('link', { name: 'ver pedidos' })).toBeInTheDocument();
  });
});
