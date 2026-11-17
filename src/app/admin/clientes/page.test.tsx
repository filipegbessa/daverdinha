import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientesPage from './page';
import { mockApi, paginated } from '@/features/admin/test-fixtures/mock-api';
import type { CustomerAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const ana: CustomerAdmin = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: '5521984448130',
  ordersCount: 3,
  totalSpent: 450,
  lastOrderAt: '2026-11-10T15:00:00Z',
  conversationId: 'conv1',
};

describe('ClientesPage', () => {
  it('lists the customers with totals, orders and the conversation', async () => {
    mockApi(() => paginated([ana, { ...ana, email: 'bia@exemplo.com', name: 'Bia', conversationId: null }]));
    render(<ClientesPage />);

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getAllByText(/3 pedidos/)).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Pedidos' })[0]).toHaveAttribute(
      'href',
      '/admin/pedidos?q=ana%40exemplo.com',
    );
    // Só a Ana tem conversa.
    expect(screen.getAllByRole('link', { name: 'Conversa' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Conversa' })).toHaveAttribute('href', '/admin/conversas/conv1');
  });

  it('sorts by total spent on the server', async () => {
    const apiFetch = mockApi(() => paginated([ana]));
    render(<ClientesPage />);
    await screen.findByText('Ana Souza');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Ordenar clientes' }), 'spent');

    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith(expect.stringContaining('sort=spent')));
  });
});
