import { render, screen, within } from '@testing-library/react';
import { OrderTimeline, orderSteps } from './OrderTimeline';
import { previewOrder } from '@/features/store/test-fixtures/order';
import type { FulfillmentStatus, PublicSiteOrder } from '@/features/store/types/store';

const paid = (fulfillmentStatus: FulfillmentStatus, delivery = true): PublicSiteOrder => ({
  ...previewOrder('paid', delivery),
  fulfillmentStatus,
});
const states = (order: PublicSiteOrder) => orderSteps(order)?.map((s) => s.state);

describe('orderSteps', () => {
  it('waits for the payment on a pending order', () => {
    expect(states(previewOrder('pending_payment'))).toEqual(['done', 'current', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('moves along the preparation', () => {
    expect(states(paid('awaiting'))).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
    expect(states(paid('preparing'))).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
    expect(states(paid('ready'))).toEqual(['done', 'done', 'done', 'done', 'current']);
    expect(states(paid('completed'))).toEqual(['done', 'done', 'done', 'done', 'done']);
  });

  it('names the last steps after the delivery method', () => {
    expect(
      orderSteps(paid('ready'))
        ?.map((s) => s.label)
        .slice(3),
    ).toEqual(['Saiu para entrega', 'Entregue']);
    expect(
      orderSteps(paid('ready', false))
        ?.map((s) => s.label)
        .slice(3),
    ).toEqual(['Pronto para retirar', 'Retirado']);
  });

  it('has no timeline for expired, cancelled or ticket orders', () => {
    expect(orderSteps(previewOrder('expired'))).toBeNull();
    expect(orderSteps(previewOrder('cancelled'))).toBeNull();
    expect(orderSteps({ ...previewOrder('paid'), kind: 'tickets' })).toBeNull();
  });
});

describe('OrderTimeline', () => {
  it('marks the current step for assistive technology', () => {
    render(<OrderTimeline order={paid('preparing')} />);
    const list = screen.getByRole('list', { name: 'Andamento do pedido' });
    const current = within(list)
      .getAllByRole('listitem')
      .find((li) => li.getAttribute('aria-current') === 'step');
    expect(current).toHaveTextContent('Em preparo (agora)');
    expect(within(list).getByText('Pedido feito')).toHaveTextContent('Pedido feito (concluído)');
  });
});
