import { act, fireEvent, render, screen } from '@testing-library/react';
import { EventBar } from './EventBar';

const events = [
  { id: '1', title: 'Oficina de terrário', startsAt: '2026-11-14T13:00:00.000Z', href: '/agenda/oficina-de-terrario' },
  { id: '2', title: 'Kokedama', startsAt: '2026-11-28T19:00:00.000Z', href: '/agenda/kokedama' },
];

describe('EventBar', () => {
  afterEach(() => jest.useRealTimers());

  it('renders nothing without highlighted events', () => {
    const { container } = render(<EventBar events={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the date in Rio time and links to the event page', () => {
    render(<EventBar events={[events[0]]} />);
    const link = screen.getByRole('link', { name: /Oficina de terrário/ });
    expect(link).toHaveAttribute('href', '/agenda/oficina-de-terrario');
    expect(link).toHaveTextContent('sáb 14/11 · 10h');
    // Um só evento não gira, então não precisa de pausa.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rotates between events and can be paused', () => {
    jest.useFakeTimers();
    render(<EventBar events={events} />);
    expect(screen.getByText('Oficina de terrário')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByText('Kokedama')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pausar a troca de eventos' }));
    act(() => jest.advanceTimersByTime(12000));
    expect(screen.getByText('Kokedama')).toBeInTheDocument();
  });
});
