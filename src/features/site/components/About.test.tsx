import { render, screen } from '@testing-library/react';
import { About, toParagraphs } from './About';

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

  it('shows the "Sobre" saved in the admin, without the Instagram link when it has no text', () => {
    render(
      <About
        content={{
          configured: true,
          title: 'Nossa história',
          text: 'Começou numa varanda.\n\nHoje é um ateliê.',
          imageUrl: null,
          instagramLabel: null,
          updatedAt: null,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nossa história' })).toBeInTheDocument();
    expect(screen.getByText('Começou numa varanda.')).toBeInTheDocument();
    expect(screen.getByText('Hoje é um ateliê.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('splits paragraphs on blank lines and joins single line breaks', () => {
    expect(toParagraphs('Um\nsó\n\n  Outro  \n\n\n')).toEqual(['Um só', 'Outro']);
  });
});
