import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PedidoPage from './page';
import { order } from '@/features/admin/test-fixtures/site-order';
import { mockApi as mockAdminApi } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'o1' }) }));

function mockApi(current = order) {
  return mockAdminApi(() => current);
}

describe('PedidoPage', () => {
  it('shows the buyer with WhatsApp, the full address, the items and the totals', async () => {
    mockApi();

    render(<PedidoPage />);

    expect(await screen.findByRole('heading', { name: 'Pedido DV-0042' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+55 (21) 99999-8888' })).toHaveAttribute(
      'href',
      'https://wa.me/5521999998888',
    );
    expect(screen.getByText(/Rua do Catete, 100 · apto 2/)).toBeInTheDocument();
    expect(screen.getByText('Observação: Deixar na portaria')).toBeInTheDocument();
    expect(screen.getByText('R$ 104,90')).toBeInTheDocument();
  });

  it('changes the preparation status of a paid order', async () => {
    const apiFetch = mockApi();

    render(<PedidoPage />);
    await userEvent.selectOptions(await screen.findByLabelText('Preparo'), 'ready');

    expect(apiFetch).toHaveBeenCalledWith('/site-orders/o1/fulfillment', {
      method: 'PATCH',
      body: JSON.stringify({ fulfillmentStatus: 'ready' }),
    });
  });

  it('cancels after a confirmation that says the refund is done in the gateway', async () => {
    const apiFetch = mockApi();

    render(<PedidoPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByText(/O estorno do pagamento é feito no painel do Pagar\.me/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Cancelar pedido' }).at(-1)!);

    expect(apiFetch).toHaveBeenCalledWith('/site-orders/o1/cancel', { method: 'POST' });
  });

  it('has no preparation nor cancel for an expired order', async () => {
    mockApi({ ...order, status: 'expired' });

    render(<PedidoPage />);

    expect(await screen.findByText('O preparo só começa depois do pagamento.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
  });
});
