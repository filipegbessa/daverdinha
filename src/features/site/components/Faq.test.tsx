import { render, screen } from '@testing-library/react';
import { Faq } from './Faq';

describe('Faq', () => {
  it('renders every question from FAQ_ITEMS as a collapsible item', () => {
    render(<Faq />);
    expect(screen.getByText('Como faço um pedido?')).toBeInTheDocument();
    expect(screen.getByText('Para quais regiões vocês entregam?')).toBeInTheDocument();
  });
});
