import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntregasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const locations = [
  { id: 'l1', zone: 'Zona Sul', regionName: 'Ipanema', covered: true },
  { id: 'l2', zone: 'Zona Oeste', regionName: 'Barra da Tijuca', covered: false },
];

describe('EntregasPage', () => {
  it('shows a loading state before the locations arrive', () => {
    const apiFetch = jest.fn().mockReturnValue(new Promise(() => {}));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('groups locations by zone', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);

    expect(await screen.findByText('Zona Sul')).toBeInTheDocument();
    expect(screen.getByText('Ipanema')).toBeInTheDocument();
    expect(screen.getByText('Zona Oeste')).toBeInTheDocument();
    expect(screen.getByText('Barra da Tijuca')).toBeInTheDocument();
  });

  it('shows an inline error when loading the locations fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar os locais de entrega.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os locais de entrega.');
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('toggling covered calls PATCH with the flipped value', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('switch', { name: 'Atendida Ipanema' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/delivery-locations/l1', {
        method: 'PATCH',
        body: JSON.stringify({ covered: false }),
      }),
    );
  });

  it('shows an inline error when toggling covered fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(locations)
      .mockRejectedValueOnce(new Error('Erro ao atualizar local de entrega.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('switch', { name: 'Atendida Ipanema' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao atualizar local de entrega.');
  });

  it('deleting a location calls DELETE', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/delivery-locations/l1', { method: 'DELETE' }));
  });

  it('shows an inline error when deleting fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(locations)
      .mockRejectedValueOnce(new Error('Erro ao excluir local de entrega.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao excluir local de entrega.');
  });

  it('opens the dialog to create a new location', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('button', { name: 'Nova região' }));

    expect(screen.getByRole('heading', { name: 'Nova região' })).toBeInTheDocument();
  });

  it('opens the dialog pre-filled to edit an existing location', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByText('Editar região')).toBeInTheDocument();
    expect(screen.getByLabelText('Zona')).toHaveValue('Zona Sul');
  });
});
