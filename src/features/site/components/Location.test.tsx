import { render, screen } from '@testing-library/react';
import { Location } from './Location';

describe('Location', () => {
  it('shows the real address', () => {
    render(<Location />);
    expect(screen.getByText('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030')).toBeInTheDocument();
  });

  it('links out to Google Maps with the business name and address encoded', () => {
    render(<Location />);
    const link = screen.getByRole('link', { name: 'Ver no Google Maps' });
    expect(link.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('Daverdinha, R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030'),
    );
  });

  it('embeds a map iframe pointing at the address, no API key needed', () => {
    render(<Location />);
    const iframe = screen.getByTitle('Mapa de localização da Daverdinha');
    expect(iframe).toHaveAttribute(
      'src',
      'https://maps.google.com/maps?q=' +
        encodeURIComponent('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030') +
        '&output=embed',
    );
  });
});
