import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '5521999999999';
  });

  it('links to Instagram and WhatsApp', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: '@daverdinha_' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/daverdinha_/',
    );
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521999999999'),
    );
  });
});
