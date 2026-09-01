import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('shows the Da Verdinha wordmark', () => {
    render(<Header />);
    expect(screen.getByText('Da Verdinha')).toBeInTheDocument();
  });

  it('links the CTA button to WhatsApp with a prefilled greeting', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986509259'));
    expect(link).toHaveAttribute('target', '_blank');
  });
});
