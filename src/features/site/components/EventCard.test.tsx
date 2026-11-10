import { render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';
import type { SiteEvent } from '@/features/site/types/event';

const event: SiteEvent = {
  id: '1',
  title: 'Oficina de Terrário',
  slug: 'oficina-de-terrario',
  description: 'Monte seu terrário do zero.',
  startsAt: '2026-11-22T17:00:00.000Z',
  endsAt: '2026-11-22T19:00:00.000Z',
  locationName: null,
  locationAddress: null,
  price: 120,
  spots: 8,
  imageUrl: 'https://example.com/terrario.jpg',
  ctaUrl: null,
};

describe('EventCard', () => {
  it('shows the event photo, date, place and price', () => {
    render(<EventCard event={event} />);
    expect(screen.getByAltText('Oficina de Terrário')).toHaveAttribute('src', expect.stringContaining('terrario.jpg'));
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('nov')).toBeInTheDocument();
    expect(screen.getByText('No ateliê')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*120/)).toBeInTheDocument();
    expect(screen.getByText('8 vagas', { exact: false })).toBeInTheDocument();
  });

  it('links to the event page and shows a call to action', () => {
    render(<EventCard event={event} />);
    const link = screen.getByRole('link', { name: /Oficina de Terrário/ });
    expect(link).toHaveAttribute('href', '/agenda/oficina-de-terrario');
    expect(screen.getByText('Ver evento')).toBeInTheDocument();
  });

  it('shows a placeholder when the event has no photo', () => {
    render(<EventCard event={{ ...event, imageUrl: null }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows "Gratuito" for free events without a spots count', () => {
    render(<EventCard event={{ ...event, price: null, spots: null }} />);
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
  });

  it('renders the old compact layout, with no photo, when asked for the compact variant', () => {
    render(<EventCard event={event} variant="compact" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver evento')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Oficina de Terrário/ })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario',
    );
    expect(screen.getByText('22')).toBeInTheDocument();
  });
});
