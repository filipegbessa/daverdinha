import { render, screen } from '@testing-library/react';
import { Location } from './Location';

describe('Location', () => {
  it('shows the real address', () => {
    render(<Location />);
    expect(screen.getByText(/R\. Capiberibe, 32 · Santo Cristo/)).toBeInTheDocument();
    expect(screen.getByText(/20220-030/)).toBeInTheDocument();
  });

  it('gives directions on Google Maps to the business', () => {
    render(<Location />);
    const link = screen.getByRole('link', { name: 'Como chegar' });
    expect(link.getAttribute('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent('Daverdinha, R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030'),
    );
  });

  it('keeps the map, loading only when scrolled into view', () => {
    render(<Location />);
    const iframe = screen.getByTitle('Mapa de localização da Daverdinha');
    expect(iframe).toHaveAttribute(
      'src',
      'https://maps.google.com/maps?q=' +
        encodeURIComponent('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030') +
        '&output=embed',
    );
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  it('hides opening hours until the client confirms them', () => {
    render(<Location />);
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });
});
