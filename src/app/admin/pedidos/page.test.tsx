import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PedidosPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';
import { order } from '@/features/admin/test-fixtures/site-order';
import { paginated } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');


describe('PedidosPage', () => {
  it('opens on paid orders with code, buyer, delivery, preparation and total', async () => {
    const apiFetch = jest.fn().mockResolvedValue(paginated([order]));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<PedidosPage />);

    expect(await screen.findByText('DV-0042')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/site-orders?status=paid');
    expect(screen.getByText(/Entrega · Catete · Preparando/)).toBeInTheDocument();
    expect(screen.getByText('R$ 104,90')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DV-0042/ })).toHaveAttribute('href', '/admin/pedidos/o1');
  });

  it('filters by status and searches by code or name on the server', async () => {
    const apiFetch = jest.fn().mockResolvedValue(paginated([]));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<PedidosPage />);
    await screen.findByText('Nenhum pedido aqui ainda.');
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por status'), 'pending_payment');
    await userEvent.type(screen.getByLabelText('Buscar pedidos'), 'maria');

    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/site-orders?status=pending_payment&q=maria'));
    expect(await screen.findByText('Nenhum pedido encontrado com essa busca.')).toBeInTheDocument();
  });
});
