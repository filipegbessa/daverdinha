import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantesPage from './page';
import { mockApi as mockAdminApi, paginated } from '@/features/admin/test-fixtures/mock-api';
import type { Attendee } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');
jest.mock('@/features/admin/lib/use-qr-scanner', () => ({ useQrScanner: () => 'scanning' }));
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'e1' }),
  useSearchParams: () => new URLSearchParams('evento=Oficina de terrário'),
}));

const attendees: Attendee[] = [
  {
    id: 't1',
    attendeeName: 'Ana Lima',
    checkedInAt: null,
    order: { id: 'o2', code: 'DV-0043', customerName: 'Maria Souza', customerPhone: '5521999998888' },
  },
  {
    id: 't2',
    attendeeName: 'Bruno Lima',
    checkedInAt: '2026-11-21T13:05:00.000Z',
    order: { id: 'o2', code: 'DV-0043', customerName: 'Maria Souza', customerPhone: '5521999998888' },
  },
];

function mockApi(spots: number | null = 20) {
  return mockAdminApi((path, init) => {
    if (init?.method === 'PATCH') return { ...attendees[0], checkedInAt: '2026-11-21T13:10:00.000Z' };
    return { ...paginated(attendees), sold: 12, spots };
  });
}

describe('ParticipantesPage', () => {
  it('shows the event and how many spots are taken, with each attendee, buyer and order', async () => {
    mockApi();

    render(<ParticipantesPage />);

    expect(screen.getByRole('heading', { name: 'Participantes' })).toBeInTheDocument();
    expect(await screen.findByText('Oficina de terrário · 12 de 20 vagas')).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Ana Lima')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/Maria Souza/)).toBeInTheDocument();
    expect(within(rows[0]).getByRole('link', { name: 'DV-0043' })).toHaveAttribute('href', '/admin/pedidos/o2');
    expect(within(rows[1]).getByRole('switch', { name: 'Bruno Lima presente' })).toBeChecked();
  });

  it('counts sign-ups when the event has no spot limit', async () => {
    mockApi(null);

    render(<ParticipantesPage />);

    expect(await screen.findByText('Oficina de terrário · 12 inscritos')).toBeInTheDocument();
  });

  it('checks an attendee in', async () => {
    const apiFetch = mockApi();
    render(<ParticipantesPage />);

    await userEvent.click(await screen.findByRole('switch', { name: 'Ana Lima presente' }));

    expect(apiFetch).toHaveBeenCalledWith('/site-order-tickets/t1/check-in', {
      method: 'PATCH',
      body: JSON.stringify({ checkedIn: true }),
    });
  });

  it('searches by attendee or buyer name', async () => {
    const apiFetch = mockApi();
    render(<ParticipantesPage />);
    await screen.findAllByRole('listitem');

    await userEvent.type(screen.getByLabelText('Buscar participantes'), 'ana');

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/events/e1/attendees?q=ana'));
  });

  it('opens the QR reader and refreshes the list after a check-in', async () => {
    const apiFetch = mockAdminApi((path) => {
      if (path === '/site-order-tickets/check-in-by-code')
        return { ...attendees[0], checkedInAt: '2026-11-21T13:10:00.000Z' };
      return { ...paginated(attendees), sold: 12, spots: 20 };
    });
    render(<ParticipantesPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Ler QR' }));
    const reader = screen.getByRole('region', { name: 'Leitor de ingressos' });
    await userEvent.type(within(reader).getByLabelText('Código do ingresso'), 'K7Q2M9XP');
    await userEvent.click(within(reader).getByRole('button', { name: 'Confirmar entrada' }));

    expect(await within(reader).findByText('Ana Lima entrou')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        apiFetch.mock.calls.filter(([path]) => String(path).startsWith('/events/e1/attendees')).length,
      ).toBeGreaterThan(1),
    );
    await userEvent.click(within(reader).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('region', { name: 'Leitor de ingressos' })).not.toBeInTheDocument();
  });
});
