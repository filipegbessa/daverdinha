import { fireEvent, render, screen } from '@testing-library/react';
import { ContactLink } from './ContactLink';

describe('ContactLink', () => {
  let gtag: jest.Mock;

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag?: jest.Mock }).gtag = gtag;
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: jest.Mock }).gtag;
  });

  it('renders a link that opens in a new tab', () => {
    render(
      <ContactLink href="https://wa.me/5521986509259" channel="whatsapp" location="coming_soon">
        Falar no WhatsApp
      </ContactLink>,
    );
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', 'https://wa.me/5521986509259');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('sends a contact_click event to GA with the channel and where it was clicked', () => {
    render(
      <ContactLink href="https://www.instagram.com/daverdinha_/" channel="instagram" location="coming_soon">
        @daverdinha_
      </ContactLink>,
    );
    fireEvent.click(screen.getByRole('link', { name: '@daverdinha_' }));
    expect(gtag).toHaveBeenCalledWith('event', 'contact_click', {
      channel: 'instagram',
      location: 'coming_soon',
    });
  });

  // GA não carrega quando NEXT_PUBLIC_GA_MEASUREMENT_ID não está setado (ou
  // num bloqueador de anúncio) — o link precisa continuar funcionando.
  it('still works when GA is not loaded', () => {
    delete (window as unknown as { gtag?: jest.Mock }).gtag;
    render(
      <ContactLink href="https://wa.me/5521986509259" channel="whatsapp" location="coming_soon">
        Falar no WhatsApp
      </ContactLink>,
    );
    expect(() => fireEvent.click(screen.getByRole('link', { name: 'Falar no WhatsApp' }))).not.toThrow();
  });
});
