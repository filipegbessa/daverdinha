import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PedidoPage from './page';
import { order, ticketOrder } from '@/features/admin/test-fixtures/site-order';
import { mockApi as mockAdminApi } from '@/features/admin/test-fixtures/mock-api';
import type { SiteOrderAdmin } from '@/features/admin/types/admin';

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

  it('asks the gateway for the payment now and shows the order it returns', async () => {
    const pending: SiteOrderAdmin = {
      ...order,
      status: 'pending_payment' as const,
      paidAt: null,
      payment: { linkId: 'pl_1', orderId: null, chargeId: null, status: null },
    };
    let current = pending;
    const apiFetch = mockApi(current);
    apiFetch.mockImplementation(async (path: string) => {
      if (path === '/site-orders/o1/sync') current = { ...pending, status: 'paid', paidAt: order.paidAt };
      return current;
    });

    render(<PedidoPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Atualizar pagamento' }));

    expect(apiFetch).toHaveBeenCalledWith('/site-orders/o1/sync', { method: 'POST' });
    expect(await screen.findByText('Pago')).toBeInTheDocument();
  });

  it('has no payment refresh when the order never reached the gateway', async () => {
    mockApi({ ...order, payment: { linkId: null, orderId: null, chargeId: null, status: null } });

    render(<PedidoPage />);

    await screen.findByRole('heading', { name: 'Pedido DV-0042' });
    expect(screen.queryByRole('button', { name: 'Atualizar pagamento' })).not.toBeInTheDocument();
  });

  it('shows the event and the attendees of a ticket order, without address nor preparation', async () => {
    mockApi(ticketOrder);

    render(<PedidoPage />);

    expect(await screen.findByRole('heading', { name: 'Pedido DV-0043' })).toBeInTheDocument();
    expect(screen.getByText('Oficina de terrário')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lista de presença' })).toHaveAttribute(
      'href',
      '/admin/eventos/e1/participantes?evento=Oficina%20de%20terr%C3%A1rio',
    );
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.queryByLabelText('Preparo')).not.toBeInTheDocument();
    expect(screen.queryByText(/retira no ateliê/)).not.toBeInTheDocument();
    expect(screen.queryByText('Entrega')).not.toBeInTheDocument();
  });

  it('resends the confirmation email of a paid order and says where it went', async () => {
    const apiFetch = mockApi();

    render(<PedidoPage />);
    expect(await screen.findByText(/E-mail de confirmação: enviado em/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reenviar confirmação' }));

    expect(apiFetch).toHaveBeenCalledWith('/site-orders/o1/resend-confirmation', { method: 'POST' });
    expect(await screen.findByRole('status')).toHaveTextContent('E-mail enviado para maria@exemplo.com.');
  });

  it('offers to send a confirmation that never went out, and shows why it failed', async () => {
    const apiFetch = mockApi({ ...order, confirmationSentAt: null });
    apiFetch.mockImplementation(async (path: string) => {
      if (path.endsWith('/resend-confirmation')) {
        throw new Error('O envio de e-mail ainda não está configurado.');
      }
      return { ...order, confirmationSentAt: null };
    });

    render(<PedidoPage />);
    expect(await screen.findByText('E-mail de confirmação: não enviado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar confirmação' }));

    expect(await screen.findByText('O envio de e-mail ainda não está configurado.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has no confirmation email for an order that is not paid', async () => {
    mockApi({ ...order, status: 'expired', confirmationSentAt: null });

    render(<PedidoPage />);

    await screen.findByRole('heading', { name: 'Pedido DV-0042' });
    expect(screen.queryByRole('button', { name: /confirmação/ })).not.toBeInTheDocument();
  });
});
