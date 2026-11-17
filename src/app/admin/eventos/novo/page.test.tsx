import { render, screen } from '@testing-library/react';
import NovoEventoPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import { oficina } from '@/features/admin/test-fixtures/event';

jest.mock('@/features/admin/lib/api-client');
let search = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => search,
}));

describe('/admin/eventos/novo', () => {
  it('starts empty', () => {
    search = new URLSearchParams();
    mockApi(() => undefined);
    render(<NovoEventoPage />);

    expect(screen.getByRole('heading', { name: 'Novo evento' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('');
  });

  it('duplicates an event as a draft, without date nor photo', async () => {
    search = new URLSearchParams('duplicar=e1');
    mockApi(() => oficina);
    render(<NovoEventoPage />);

    expect(await screen.findByLabelText('Título')).toHaveValue(`${oficina.title} (cópia)`);
    expect(screen.getByLabelText('Início')).toHaveValue('');
    expect(screen.getByRole('switch', { name: 'Publicado' })).not.toBeChecked();
    expect(screen.getByText(/Escolha a data e a foto/)).toBeInTheDocument();
  });
});
