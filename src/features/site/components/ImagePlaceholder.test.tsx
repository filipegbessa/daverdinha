import { render, screen } from '@testing-library/react';
import { ImagePlaceholder } from './ImagePlaceholder';

describe('ImagePlaceholder', () => {
  it('renders a decorative placeholder when no src is given', () => {
    const { container } = render(<ImagePlaceholder alt="Foto do ateliê" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders the real image once a src is provided', () => {
    render(<ImagePlaceholder src="/images/atelie.jpg" alt="Foto do ateliê" />);
    expect(screen.getByAltText('Foto do ateliê')).toBeInTheDocument();
  });
});
