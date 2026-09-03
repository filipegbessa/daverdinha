import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryLocationDialog } from '@/features/admin/components/DeliveryLocationDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('DeliveryLocationDialog', () => {
  it('POSTs a new location when creating', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<DeliveryLocationDialog location={null} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Zona'), 'Zona Sul');
    await userEvent.type(screen.getByLabelText('Bairro/Região'), 'Urca');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith(
      '/delivery-locations',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ zone: 'Zona Sul', regionName: 'Urca', covered: true }) }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('PATCHes the existing location when editing', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const location = { id: 'l1', zone: 'Zona Oeste', regionName: 'Barra da Tijuca', covered: false };

    render(<DeliveryLocationDialog location={location} onClose={jest.fn()} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/delivery-locations/l1', expect.objectContaining({ method: 'PATCH' })),
    );
  });

  it('shows an inline error and does not close when saving fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe um local de entrega com essa região.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();
    const onClose = jest.fn();

    render(<DeliveryLocationDialog location={null} onClose={onClose} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Zona'), 'Zona Sul');
    await userEvent.type(screen.getByLabelText('Bairro/Região'), 'Urca');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um local de entrega com essa região.');
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
