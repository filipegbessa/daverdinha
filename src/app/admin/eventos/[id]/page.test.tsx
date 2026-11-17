import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventoPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import { oficina } from '@/features/admin/test-fixtures/event';

jest.mock('@/features/admin/lib/api-client');
const push = jest.fn();
let search = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'e1' }),
  useRouter: () => ({ push }),
  useSearchParams: () => search,
}));

describe('/admin/eventos/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = new URLSearchParams();
  });

  it('opens the event from the admin route, with see on the site and duplicate', async () => {
    const apiFetch = mockApi(() => oficina);

    render(<EventoPage />);

    expect(await screen.findByRole('heading', { name: oficina.title, level: 1 })).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/events/e1/admin');
    expect(screen.getByRole('link', { name: 'Ver no site' })).toHaveAttribute('href', `/agenda/${oficina.slug}`);
    expect(screen.getByRole('link', { name: 'Duplicar' })).toHaveAttribute('href', '/admin/eventos/novo?duplicar=e1');
  });

  it('shows the API refusal when the event has tickets and cannot be deleted', async () => {
    mockApi((path, init) => {
      if (init?.method === 'DELETE')
        throw new Error('Esse evento tem ingressos vendidos. Despublique em vez de excluir.');
      return oficina;
    });

    render(<EventoPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir evento' }));

    expect(await screen.findByText(/Despublique em vez de excluir/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
