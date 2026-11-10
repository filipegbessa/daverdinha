import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('uses the neutral theme color by default', () => {
    render(<Badge>Destaque</Badge>);
    expect(screen.getByText('Destaque')).toHaveClass('bg-secondary');
  });

  it('paints a marcador in its own color with readable text', () => {
    render(<Badge color="#000000">Urgente</Badge>);
    expect(screen.getByText('Urgente')).toHaveStyle({ backgroundColor: '#000000', color: '#ffffff' });
  });
});
