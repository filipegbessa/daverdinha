import { render, screen } from '@testing-library/react';
import { AvailabilityBadge } from './AvailabilityBadge';

describe('AvailabilityBadge', () => {
  it('shows ready stock and sold out', () => {
    const { rerender } = render(<AvailabilityBadge product={{ availability: 'in_stock', leadTimeDays: null }} />);
    expect(screen.getByText('Pronta entrega')).toBeInTheDocument();

    rerender(<AvailabilityBadge product={{ availability: 'sold_out', leadTimeDays: null }} />);
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
  });

  it('fits made-to-order and its lead time in one line on the card', () => {
    render(<AvailabilityBadge product={{ availability: 'made_to_order', leadTimeDays: 10 }} />);
    expect(screen.getByText('Sob encomenda · até 10 dias')).toBeInTheDocument();
  });

  it('explains the lead time on the product page', () => {
    render(<AvailabilityBadge detailed product={{ availability: 'made_to_order', leadTimeDays: 1 }} />);
    expect(screen.getByText('Sob encomenda')).toBeInTheDocument();
    expect(screen.getByText(/a confecção leva até 1 dia/)).toBeInTheDocument();
  });

  it('points to WhatsApp when there is no lead time yet', () => {
    const { rerender } = render(<AvailabilityBadge product={{ availability: 'made_to_order', leadTimeDays: null }} />);
    expect(screen.getByText('Sob encomenda')).toBeInTheDocument();

    rerender(<AvailabilityBadge detailed product={{ availability: 'made_to_order', leadTimeDays: null }} />);
    expect(screen.getByText(/combinado pelo WhatsApp/)).toBeInTheDocument();
  });
});
