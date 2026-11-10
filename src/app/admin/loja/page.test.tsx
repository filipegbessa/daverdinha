import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LojaPage from './page';
import { mockApi as mockAdminApi } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');

const settings = {
  pickupEnabled: true,
  pickupAddress: 'R. Capiberibe, 32 - Santo Cristo',
  pickupHours: 'Seg a sex, 10h às 18h',
  pickupInstructions: null,
  maxInstallments: 3,
  minInstallmentValue: 30,
};

function mockApi(save: () => Promise<unknown> = async () => settings) {
  return mockAdminApi((path, init) => (init ? save() : settings));
}

describe('LojaPage', () => {
  it('loads pickup and installment settings into the form', async () => {
    mockApi();

    render(<LojaPage />);

    expect(await screen.findByLabelText('Endereço')).toHaveValue('R. Capiberibe, 32 - Santo Cristo');
    expect(screen.getByRole('switch', { name: 'Oferecer retirada no ateliê' })).toBeChecked();
    expect(screen.getByLabelText('Máximo de parcelas')).toHaveValue('3');
    expect(screen.getByLabelText('Valor mínimo da parcela')).toHaveValue('R$ 30,00');
    expect(screen.getByText(/pode ser pago em até 3x de R\$ 33,33/)).toBeInTheDocument();
  });

  it('saves everything with one PATCH, with money as a number and empty instructions as null', async () => {
    const apiFetch = mockApi();

    render(<LojaPage />);
    await userEvent.click(await screen.findByRole('switch', { name: 'Oferecer retirada no ateliê' }));
    await userEvent.selectOptions(screen.getByLabelText('Máximo de parcelas'), '6');
    await userEvent.clear(screen.getByLabelText('Valor mínimo da parcela'));
    await userEvent.type(screen.getByLabelText('Valor mínimo da parcela'), '2500');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/store-settings', {
      method: 'PATCH',
      body: JSON.stringify({
        pickupEnabled: false,
        pickupAddress: 'R. Capiberibe, 32 - Santo Cristo',
        pickupHours: 'Seg a sex, 10h às 18h',
        pickupInstructions: null,
        maxInstallments: 6,
        minInstallmentValue: 25,
      }),
    });
    expect(await screen.findByText('Configurações salvas.')).toBeInTheDocument();
  });

  it('updates the installment example as the settings change', async () => {
    mockApi();

    render(<LojaPage />);
    await userEvent.selectOptions(await screen.findByLabelText('Máximo de parcelas'), '1');

    expect(screen.getByText(/só pode ser pago à vista/)).toBeInTheDocument();
  });

  it('does not save without an address or hours', async () => {
    const apiFetch = mockApi();

    render(<LojaPage />);
    await userEvent.clear(await screen.findByLabelText('Horário'));

    expect(screen.getByLabelText('Horário')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('shows the API error and keeps what was typed', async () => {
    mockApi(() => Promise.reject(new Error('Erro ao salvar as configurações da loja.')));

    render(<LojaPage />);
    await userEvent.type(await screen.findByLabelText('Instruções (opcional)'), 'Toque o interfone');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Erro ao salvar as configurações da loja.')).toBeInTheDocument();
    expect(screen.getByLabelText('Instruções (opcional)')).toHaveValue('Toque o interfone');
  });
});
