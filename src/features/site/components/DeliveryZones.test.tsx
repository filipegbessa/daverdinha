import { render, screen } from '@testing-library/react';
import { DeliveryZones } from './DeliveryZones';

describe('DeliveryZones', () => {
  it('renders every zone name from the data module', () => {
    render(<DeliveryZones />);
    expect(screen.getByText('Zona Sul')).toBeInTheDocument();
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Zona Portuária')).toBeInTheDocument();
    expect(screen.getByText('Zona Norte')).toBeInTheDocument();
  });

  it('renders a representative neighborhood to prove bairros are listed, not just zone names', () => {
    render(<DeliveryZones />);
    expect(screen.getByText(/Ipanema/)).toBeInTheDocument();
  });
});
