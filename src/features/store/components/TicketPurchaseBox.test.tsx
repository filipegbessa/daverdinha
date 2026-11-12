import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketPurchaseBox } from './TicketPurchaseBox';
import type { SiteEvent } from '@/features/site/types/event';

const event: SiteEvent = {
  id: 'e1',
  title: 'Oficina de terrário',
  slug: 'oficina-de-terrario',
  description: 'Monte o seu.',
  startsAt: '2099-11-21T13:00:00.000Z',
  endsAt: '2099-11-21T15:00:00.000Z',
  locationName: null,
  locationAddress: null,
  price: 45,
  spots: 20,
  imageUrl: null,
  ctaUrl: null,
  ticketSales: true,
  maxTicketsPerOrder: 4,
  spotsLeft: 3,
  soldOut: false,
};

describe('TicketPurchaseBox', () => {
  it('shows price and spots, and takes the chosen quantity to the ticket checkout', async () => {
    render(<TicketPurchaseBox event={event} />);

    const box = screen.getByRole('region', { name: 'Comprar ingresso' });
    expect(within(box).getByText('R$ 45,00 por pessoa')).toBeInTheDocument();
    expect(within(box).getByText('Restam 3 vagas')).toBeInTheDocument();
    expect(within(box).queryByRole('textbox')).not.toBeInTheDocument();

    await userEvent.click(within(box).getByRole('button', { name: 'Aumentar' }));

    expect(within(box).getByRole('link', { name: 'Comprar ingresso' })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario/ingressos?quantidade=2',
    );
    expect(screen.getByRole('link', { name: 'Comprar ingresso (barra)' })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario/ingressos?quantidade=2',
    );
  });

  it('stops the quantity at the spots left', async () => {
    render(<TicketPurchaseBox event={{ ...event, spotsLeft: 2 }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar' }));

    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDisabled();
  });

  it('says "Inscrever-se" for a free event', () => {
    render(<TicketPurchaseBox event={{ ...event, price: null, spotsLeft: null }} />);

    const box = screen.getByRole('region', { name: 'Inscrever-se' });
    expect(within(box).getByText('Gratuito')).toBeInTheDocument();
    expect(within(box).getByRole('link', { name: 'Inscrever-se' })).toBeInTheDocument();
  });

  it('turns into "Esgotado" with WhatsApp when there are no spots', () => {
    render(<TicketPurchaseBox event={{ ...event, spotsLeft: 0, soldOut: true }} />);

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Comprar ingresso' })).not.toBeInTheDocument();
  });
});
