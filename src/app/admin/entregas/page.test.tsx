import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntregasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const locations = [
  { id: 'l1', zone: 'Zona Sul', regionName: 'Ipanema', covered: true },
  { id: 'l2', zone: 'Zona Sul', regionName: 'Copacabana', covered: false },
  { id: 'l3', zone: 'Zona Oeste', regionName: 'Barra da Tijuca', covered: true },
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
    expect(screen.getByText('Copacabana')).toBeInTheDocument();
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

  it('toggling a bairro calls PATCH with the flipped value', async () => {
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

  it('shows an inline error when toggling a bairro fails', async () => {
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

  it('shows the region checkbox as checked when every bairro in it is covered', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Barra da Tijuca');

    expect(screen.getByRole('checkbox', { name: 'Marcar toda a região Zona Oeste' })).toBeChecked();
  });

  it('shows the region checkbox as unchecked and not indeterminate when every bairro in it is not covered', async () => {
    const apiFetch = jest.fn().mockResolvedValue([
      { id: 'l1', zone: 'Centro', regionName: 'Lapa', covered: false },
      { id: 'l2', zone: 'Centro', regionName: 'Saúde', covered: false },
    ]);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Lapa');

    const checkbox = screen.getByRole('checkbox', { name: 'Marcar toda a região Centro' });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toBePartiallyChecked();
  });

  it('shows the region checkbox as indeterminate when the region has mixed coverage', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    expect(screen.getByRole('checkbox', { name: 'Marcar toda a região Zona Sul' })).toBePartiallyChecked();
  });

  it('clicking a mixed-coverage region checkbox covers every bairro that was not already covered', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Marcar toda a região Zona Sul' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/delivery-locations/l2', {
        method: 'PATCH',
        body: JSON.stringify({ covered: true }),
      }),
    );
    expect(apiFetch).not.toHaveBeenCalledWith('/delivery-locations/l1', expect.anything());
  });

  it('reloads and shows an error when part of a region batch fails', async () => {
    // Local fixture: two bairros in the same region both need to flip, so the
    // batch has two PATCH calls in flight -- one succeeds, one fails.
    const zonaSul = [
      { id: 'l1', zone: 'Zona Sul', regionName: 'Ipanema', covered: false },
      { id: 'l2', zone: 'Zona Sul', regionName: 'Copacabana', covered: false },
    ];
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(zonaSul) // initial load
      .mockResolvedValueOnce(undefined) // PATCH l1 succeeds
      .mockRejectedValueOnce(new Error('nope')) // PATCH l2 fails
      .mockResolvedValueOnce([
        { id: 'l1', zone: 'Zona Sul', regionName: 'Ipanema', covered: true },
        { id: 'l2', zone: 'Zona Sul', regionName: 'Copacabana', covered: false },
      ]); // reload reflecting the server's actual (partially-updated) state
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Marcar toda a região Zona Sul' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao atualizar a região.');
    // the reload happened -- the list reflects the server's real (partial) state, not the stale pre-click one
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Atendida Ipanema' })).toBeChecked());
    expect(screen.getByRole('switch', { name: 'Atendida Copacabana' })).not.toBeChecked();
  });

  it('clicking a fully-covered region checkbox uncovers every bairro in it', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Barra da Tijuca');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Marcar toda a região Zona Oeste' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/delivery-locations/l3', {
        method: 'PATCH',
        body: JSON.stringify({ covered: false }),
      }),
    );
  });

  it('the "Atende" filter hides non-covered bairros without hiding their region header', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    await userEvent.click(screen.getByRole('button', { name: 'Atende' }));

    expect(screen.getByText('Ipanema')).toBeInTheDocument();
    expect(screen.queryByText('Copacabana')).not.toBeInTheDocument();
    expect(screen.getByText('Zona Sul')).toBeInTheDocument();
  });

  it('the "Não atende" filter can leave a region listed with an empty bairro list', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Barra da Tijuca');

    await userEvent.click(screen.getByRole('button', { name: 'Não atende' }));

    expect(screen.getByText('Zona Oeste')).toBeInTheDocument();
    expect(screen.queryByText('Barra da Tijuca')).not.toBeInTheDocument();
  });

  it('renders no controls to create, rename, or delete a bairro', async () => {
    const apiFetch = jest.fn().mockResolvedValue(locations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<EntregasPage />);
    await screen.findByText('Ipanema');

    expect(screen.queryByRole('button', { name: 'Nova região' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });
});
