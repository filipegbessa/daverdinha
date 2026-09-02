import { render, screen } from '@testing-library/react';
import { About } from './About';

describe('About', () => {
  it('shows the real about copy and Instagram link', () => {
    render(<About />);
    expect(
      screen.getByText('Daverdinha é um espaço pra plantar, criar e brindar 🌱 Atendimento e entrega combinados direto pelo WhatsApp — é só chamar a gente por lá.'),
    ).toBeInTheDocument();
    const igLink = screen.getByRole('link', { name: '@daverdinha_' });
    expect(igLink).toHaveAttribute('href', 'https://www.instagram.com/daverdinha_/');
  });
});
