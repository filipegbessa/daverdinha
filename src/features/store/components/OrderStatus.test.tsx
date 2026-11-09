import { render, screen } from '@testing-library/react';
import { OrderStatus } from './OrderStatus';
import { PurchaseTracker } from './PurchaseTracker';
import { previewOrder } from '@/features/store/lib/preview-order';

describe('OrderStatus', () => {
  it('pending: shows the deadline, pay now and "already paid", which reloads the page', () => {
    render(<OrderStatus order={previewOrder('pending_payment')} reloadHref="/pedido/abc" />);

    expect(screen.getByRole('heading', { name: 'Aguardando pagamento' })).toBeInTheDocument();
    expect(screen.getByText(/Você tem até/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagar agora' })).toHaveAttribute('href', '#pagamento-de-exemplo');
    expect(screen.getByRole('link', { name: 'Já paguei' })).toHaveAttribute('href', '/pedido/abc');
  });

  it('paid: confirms, says where it is in preparation and where it goes', () => {
    render(<OrderStatus order={previewOrder('paid')} reloadHref="/pedido/abc" />);

    expect(screen.getByRole('heading', { name: 'Pedido confirmado!' })).toBeInTheDocument();
    expect(screen.getByText('Estamos preparando o seu pedido.')).toBeInTheDocument();
    expect(screen.getByText('Entrega em Santo Cristo.')).toBeInTheDocument();
    expect(screen.getByText(/depois da confecção, em até/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pagar agora' })).not.toBeInTheDocument();
  });

  it('paid pickup: shows the atelier address', () => {
    render(<OrderStatus order={previewOrder('paid', false)} reloadHref="/pedido/abc" />);

    expect(screen.getByText(/Retirada no ateliê: R\. Capiberibe, 32/)).toBeInTheDocument();
  });

  it('expired: nothing was charged and the products are a link away', () => {
    render(<OrderStatus order={previewOrder('expired')} reloadHref="/pedido/abc" />);

    expect(screen.getByRole('heading', { name: 'O prazo de pagamento acabou' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos');
  });

  it('always offers WhatsApp with the order code', () => {
    render(<OrderStatus order={previewOrder('cancelled')} reloadHref="/pedido/abc" />);

    const link = screen.getByRole('link', { name: 'Falar no WhatsApp sobre o pedido DV-0001' });
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('DV-0001');
  });
});

describe('PurchaseTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    window.gtag = jest.fn();
  });

  it('counts a paid order once, even after a reload', () => {
    const order = previewOrder('paid');

    render(<PurchaseTracker order={order} />);
    render(<PurchaseTracker order={order} />);

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({ transaction_id: 'DV-0001', value: order.total, currency: 'BRL' }),
    );
  });

  it('does not count an order that is not paid', () => {
    render(<PurchaseTracker order={previewOrder('pending_payment')} />);

    expect(window.gtag).not.toHaveBeenCalled();
  });
});
