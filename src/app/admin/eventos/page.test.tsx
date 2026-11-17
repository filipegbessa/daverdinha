import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventosPage from './page';
import { mockApi as mockAdminApi, paginated } from '@/features/admin/test-fixtures/mock-api';
import { oficina } from '@/features/admin/test-fixtures/event';
import type { EventAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const feirinha: EventAdmin = {
  ...oficina,
  id: 'e2',
  title: 'Feirinha verde',
  slug: 'feirinha-verde',
  startsAt: '2020-01-11T12:00:00.000Z',
  endsAt: '2020-01-11T18:00:00.000Z',
  price: null,
  spots: null,
  ticketSales: false,
  published: false,
  sold: 0,
  imageUrl: null,
};

const inscricao: EventAdmin = {
  ...oficina,
  id: 'e3',
  title: 'Aula aberta',
  slug: 'aula-aberta',
  price: null,
  spots: null,
  sold: 8,
};

function mockApi({
  events = [oficina, feirinha, inscricao],
  ticketsEnabled = true,
  remove,
}: { events?: EventAdmin[]; ticketsEnabled?: boolean; remove?: () => unknown } = {}) {
  return mockAdminApi((path, init) => {
    if (path === '/store-settings') return { ticketsEnabled };
    if (init?.method === 'DELETE') return remove?.();
    return paginated(events);
  });
}

describe('EventosPage', () => {
  it('lists events with date, publication, past events and sales', async () => {
    mockApi();

    render(<EventosPage />);

    const rows = await screen.findAllByRole('listitem');
    expect(within(rows[0]).getByText('Oficina de terrário')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/21\/11\/2026 10:00/)).toBeInTheDocument();
    expect(within(rows[0]).getByText('Publicado')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/3 de 8 vagas/)).toBeInTheDocument();
    expect(within(rows[0]).getByRole('link', { name: 'Participantes' })).toHaveAttribute(
      'href',
      '/admin/eventos/e1/participantes?evento=Oficina%20de%20terr%C3%A1rio',
    );
    expect(within(rows[1]).getByText('Rascunho')).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Já aconteceu/)).toBeInTheDocument();
    expect(within(rows[1]).queryByRole('link', { name: 'Participantes' })).not.toBeInTheDocument();
    expect(within(rows[2]).getByText(/8 inscritos/)).toBeInTheDocument();
  });

  it('says the sale is paused when the Dashboard switch is off', async () => {
    mockApi({ ticketsEnabled: false });

    render(<EventosPage />);

    const rows = await screen.findAllByRole('listitem');
    expect(within(rows[0]).getByText(/Venda pausada no Dashboard/)).toBeInTheDocument();
    expect(within(rows[0]).queryByText(/de 8 vagas/)).not.toBeInTheDocument();
  });

  it('searches by title', async () => {
    const apiFetch = mockApi();
    render(<EventosPage />);
    await screen.findAllByRole('listitem');

    await userEvent.type(screen.getByLabelText('Buscar eventos'), 'feira');

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/events?q=feira'));
  });

  it('links to the event pages to create and edit', async () => {
    mockApi();
    render(<EventosPage />);
    await screen.findAllByRole('listitem');

    expect(screen.getByRole('link', { name: 'Novo evento' })).toHaveAttribute('href', '/admin/eventos/novo');
    expect(screen.getByRole('link', { name: 'Editar Oficina de terrário' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/admin\/eventos\/[^/]+$/),
    );
  });

  it('shows the API refusal as is when an event with tickets cannot be deleted', async () => {
    mockApi({
      remove: () => {
        throw new Error('Esse evento tem ingressos vendidos. Despublique em vez de excluir.');
      },
    });
    render(<EventosPage />);
    await screen.findAllByRole('listitem');

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Excluir evento' }));

    expect(
      await screen.findByText('Esse evento tem ingressos vendidos. Despublique em vez de excluir.'),
    ).toBeInTheDocument();
  });
});
