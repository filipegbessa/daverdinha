import { render, screen } from '@testing-library/react';
import { About } from './About';

describe('About', () => {
  it('shows the about copy and the Instagram link', () => {
    render(<About />);
    expect(screen.getByRole('heading', { name: 'Um espaço pra plantar, criar e brindar' })).toBeInTheDocument();
    expect(screen.getByText(/ateliê de plantas no Santo Cristo/)).toBeInTheDocument();
    const igLink = screen.getByRole('link', { name: '@daverdinha_' });
    expect(igLink).toHaveAttribute('href', 'https://www.instagram.com/daverdinha_/');
  });

  it('is the target of the "Sobre" menu link', () => {
    const { container } = render(<About />);
    expect(container.querySelector('section#sobre')).not.toBeNull();
  });
});
