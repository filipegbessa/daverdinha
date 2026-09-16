import { render, screen } from '@testing-library/react';
import { DeliveryZones } from './DeliveryZones';

const zones = [
  { zone: 'Centro', bairros: ['Gamboa', 'Santo Cristo', 'Saúde'] },
  { zone: 'Zona Sul', bairros: ['Botafogo', 'Ipanema'] },
];

describe('DeliveryZones', () => {
  it('renders a card per zone it was given', () => {
    render(<DeliveryZones zones={zones} />);

    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Zona Sul')).toBeInTheDocument();
  });

  it('lists the bairros, not just the zone names', () => {
    render(<DeliveryZones zones={zones} />);

    expect(screen.getByText('Gamboa, Santo Cristo, Saúde')).toBeInTheDocument();
    expect(screen.getByText('Botafogo, Ipanema')).toBeInTheDocument();
  });

  it('renders nothing when no area is covered, instead of an empty promise', () => {
    const { container } = render(<DeliveryZones zones={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Onde entregamos')).not.toBeInTheDocument();
  });
});
