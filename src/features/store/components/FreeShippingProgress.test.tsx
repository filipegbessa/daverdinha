import { render, screen } from '@testing-library/react';
import { FreeShippingProgress } from './FreeShippingProgress';

describe('FreeShippingProgress', () => {
  it('says how much is missing, with the progress', () => {
    render(<FreeShippingProgress freeShipping={{ minSubtotal: 200, remaining: 50, reached: false }} />);
    expect(screen.getByText(/Faltam/)).toHaveTextContent('Faltam R$ 50,00 para frete grátis');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('celebrates when the minimum is reached', () => {
    render(<FreeShippingProgress freeShipping={{ minSubtotal: 200, remaining: 0, reached: true }} />);
    expect(screen.getByText('Você ganhou frete grátis!')).toBeInTheDocument();
  });

  it('renders nothing without a promotion', () => {
    const { container } = render(<FreeShippingProgress freeShipping={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
