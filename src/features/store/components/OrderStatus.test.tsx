import { render, screen } from '@testing-library/react';
import { OrderStatus } from './OrderStatus';
import { PurchaseTracker } from './PurchaseTracker';
import { previewOrder } from '@/features/store/lib/preview-order';
import type { PublicSiteOrder } from '@/features/store/types/store';

/** Pedido de ingresso: evento e participantes no lugar de itens e entrega. */
function ticketOrder(overrides: Partial<PublicSiteOrder> = {}): PublicSiteOrder {
  return {
    ...previewOrder('paid'),
    code: 'DV-0043',
    kind: 'tickets',
    fulfillmentStatus: 'awaiting',
    items: [],
    event: {
      title: 'Oficina de terrário',
      slug: 'oficina-de-terrario',
      startsAt: '2026-11-21T13:00:00.000Z',
      endsAt: '2026-11-21T15:00:00.000Z',
      locationName: null,
      locationAddress: null,
    },
    tickets: [
      { attendeeName: 'Ana Lima', unitPrice: 45 },
      { attendeeName: 'Bruno Lima', unitPrice: 45 },
    ],
    subtotal: 90,
    deliveryFee: 0,
    total: 90,
    deliveryMethod: null,
    bairro: null,
    pickup: null,
    ...overrides,
  };
}

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

describe('OrderStatus with tickets', () => {
  it('paid: confirms the ticket and lists the event and the attendees, with no preparation', () => {
    render(<OrderStatus order={ticketOrder()} reloadHref="/pedido/abc" />);

    expect(screen.getByRole('heading', { name: 'Ingresso confirmado!' })).toBeInTheDocument();
    expect(screen.getByText('Apresente esta página ou diga o nome na entrada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Oficina de terrário' })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario',
    );
    expect(screen.getByText('No ateliê')).toBeInTheDocument();
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.queryByText(/preparando/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entrega/)).not.toBeInTheDocument();
  });

  it('paid and free: confirms the sign-up', () => {
    render(
      <OrderStatus
        order={ticketOrder({ total: 0, subtotal: 0, tickets: [{ attendeeName: 'Ana Lima', unitPrice: 0 }] })}
        reloadHref="/pedido/abc"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Inscrição confirmada!' })).toBeInTheDocument();
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
  });

  it('expired: links back to the event', () => {
    render(<OrderStatus order={ticketOrder({ status: 'expired' })} reloadHref="/pedido/abc" />);

    expect(screen.getByRole('heading', { name: 'O prazo de pagamento acabou' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao evento' })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario',
    );
    expect(screen.queryByRole('link', { name: 'Ver produtos' })).not.toBeInTheDocument();
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

  it('counts a free sign-up as a lead, once, and never as a purchase', () => {
    const order = ticketOrder({ total: 0, subtotal: 0 });

    render(<PurchaseTracker order={order} />);
    render(<PurchaseTracker order={order} />);

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'generate_lead', expect.objectContaining({ value: 0 }));
  });

  it('counts a paid ticket as a purchase of the event', () => {
    render(<PurchaseTracker order={ticketOrder()} />);

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        transaction_id: 'DV-0043',
        items: [expect.objectContaining({ item_name: 'Oficina de terrário', quantity: 2, price: 45 })],
      }),
    );
  });
});
